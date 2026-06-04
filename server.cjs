const express = require('express');
const cors = require('cors');
const multer = require('multer');
const B2 = require('backblaze-b2');
const crypto = require('crypto');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_your_stripe_secret_key');

// Firebase Admin - optional for now, using mock for file uploads
let db = null;
try {
  const admin = require('firebase-admin');
  const serviceAccount = require('./firebase-service-account.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'skillstreetofficial'
  });
  db = admin.firestore();
} catch (error) {
  console.log('Firebase Admin not configured - payment features will be limited');
}

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// Backblaze B2 Configuration
const b2 = new B2({
  applicationKeyId: process.env.B2_KEY_ID || '005b615bee76ed80000000003',
  applicationKey: process.env.B2_KEY_SECRET || 'K005K1EPsyXa55e/T9v1fukdGuZPVzA',
});

const BUCKET_ID = process.env.B2_BUCKET_ID || 'YOUR_BUCKET_ID_HERE';
const BUCKET_NAME = process.env.B2_BUCKET_NAME || 'YOUR_BUCKET_NAME_HERE';

// Platform commission rate (10%)
const COMMISSION_RATE = 10;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'DELETE'],
}));
app.use(express.json());

// Initialize B2 authorization
let b2Authorized = false;

async function authorizeB2() {
  try {
    console.log('Attempting B2 authorization...');

    await b2.authorize();

    b2Authorized = true;

    console.log('B2 Authorized successfully');
  } catch (error) {
    console.error('B2 Authorization error:', error.message);

    b2Authorized = false;
  }
}

// Upload file to B2
app.post('/api/upload', upload.single('file'), async (req, res) => {

  try {

    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded',
      });
    }

    // IMPORTANT
    if (!b2Authorized) {
      await authorizeB2();
    }

    const uploadResponse = await b2.getUploadUrl({
      bucketId: BUCKET_ID,
    });

    const fileName = `${Date.now()}-${req.file.originalname}`;

    const uploadResult = await b2.uploadFile({
      uploadUrl: uploadResponse.data.uploadUrl,
      uploadAuthToken: uploadResponse.data.authorizationToken,
      fileName: fileName,
      data: req.file.buffer,
      contentType: req.file.mimetype,
    });

    const fileUrl = `https://f005.backblazeb2.com/file/${BUCKET_NAME}/${fileName}`;

    res.json({
      success: true,
      fileId: uploadResult.data.fileId,
      bucketId: BUCKET_ID,
      fileUrl: fileUrl,
      fileName: fileName,
    });

  } catch (error) {

    console.error('UPLOAD ERROR:', error);

    res.status(500).json({
      error: 'Upload failed',
      details: error.message,
    });

  }

});

     
    
  
  


// Get download URL for a file
app.get('/api/download/:fileId', async (req, res) => {
  try {
    if (!b2Authorized) {
      await authorizeB2();
    }

    const fileId = req.params.fileId;

    // Get file info to get the file name
    const fileInfo = await b2.getFileInfo({ fileId });
    
    // Generate download authorization
    const downloadAuth = await b2.getDownloadAuthorization({
      bucketId: BUCKET_ID,
      fileNamePrefix: fileInfo.data.fileName,
      validDurationInSeconds: 3600, // 1 hour
    });

    // Construct download URL
    const downloadUrl = `https://f002.backblazeb2.com/file/${BUCKET_NAME}/${fileInfo.data.fileName}?Authorization=${downloadAuth.data.authorizationToken}`;

    res.json({ downloadUrl });
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Failed to get download URL' });
  }
});

// Delete file from B2
app.delete('/api/delete/:fileId', async (req, res) => {
  try {
    if (!b2Authorized) {
      await authorizeB2();
    }

    const fileId = req.params.fileId;

    // Get file info to get the file name
    const fileInfo = await b2.getFileInfo({ fileId });

    // Delete file
    await b2.deleteFileVersion({
      fileId: fileId,
      fileName: fileInfo.data.fileName,
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// Payment API Endpoints

// Create payment intent for task approval
app.post('/api/payments/create-intent', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: 'Firebase not configured - payment features unavailable' });
    }

    const { submissionId, taskId, companyId, studentId, amount } = req.body;

    if (!submissionId || !taskId || !companyId || !studentId || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Convert amount to cents for Stripe
    const amountInCents = Math.round(parseFloat(amount) * 100);

    // Calculate commission
    const platformCommission = Math.round(amountInCents * (COMMISSION_RATE / 100));
    const studentAmount = amountInCents - platformCommission;

    // Create Stripe Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'inr',
      metadata: {
        submissionId,
        taskId,
        companyId,
        studentId,
        platformCommission: platformCommission.toString(),
        studentAmount: studentAmount.toString()
      }
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: amountInCents,
      platformCommission,
      studentAmount
    });
  } catch (error) {
    console.error('Payment intent creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Confirm payment and create payment record
app.post('/api/payments/confirm', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: 'Firebase not configured - payment features unavailable' });
    }

    const { paymentIntentId, submissionId, taskId, companyId, studentId, studentName, studentEmail, companyName, taskTitle, totalAmount, platformCommission, studentAmount } = req.body;

    // Verify payment intent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ error: 'Payment not successful' });
    }

    // Create payment record in Firebase
    const paymentData = {
      taskId,
      taskTitle,
      submissionId,
      companyId,
      companyName,
      studentId,
      studentName,
      studentEmail,
      totalAmount: parseInt(totalAmount),
      platformCommission: parseInt(platformCommission),
      studentAmount: parseInt(studentAmount),
      status: 'completed',
      stripePaymentIntentId: paymentIntentId,
      commissionRate: COMMISSION_RATE,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString()
    };

    const paymentRef = await addDoc(collection(db, 'payments'), paymentData);

    // Update submission with payment info
    await updateDoc(doc(db, 'submissions', submissionId), {
      paymentId: paymentRef.id,
      paymentStatus: 'completed',
      paidAt: new Date().toISOString()
    });

    // Create approval record
    const approvalData = {
      taskId,
      submissionId,
      companyId,
      studentId,
      approved: true,
      approvedAt: new Date().toISOString(),
      approvedBy: companyId,
      paymentTriggered: true,
      paymentId: paymentRef.id,
      createdAt: new Date().toISOString()
    };

    await addDoc(collection(db, 'task_approvals'), approvalData);

    res.json({
      success: true,
      paymentId: paymentRef.id,
      message: 'Payment processed successfully'
    });
  } catch (error) {
    console.error('Payment confirmation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get payment history for a user
app.get('/api/payments/history/:userId', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: 'Firebase not configured - payment features unavailable' });
    }

    const { userId } = req.params;
    const { userType } = req.query; // 'student' or 'company'

    let paymentsQuery;
    if (userType === 'student') {
      paymentsQuery = query(collection(db, 'payments'), where('studentId', '==', userId));
    } else if (userType === 'company') {
      paymentsQuery = query(collection(db, 'payments'), where('companyId', '==', userId));
    } else {
      return res.status(400).json({ error: 'Invalid user type' });
    }

    const querySnapshot = await getDocs(paymentsQuery);
    const payments = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    res.json({ payments });
  } catch (error) {
    console.error('Payment history error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get approval status for a submission
app.get('/api/approvals/submission/:submissionId', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: 'Firebase not configured - payment features unavailable' });
    }

    const { submissionId } = req.params;

    const approvalQuery = query(collection(db, 'task_approvals'), where('submissionId', '==', submissionId));
    const querySnapshot = await getDocs(approvalQuery);

    if (querySnapshot.empty) {
      return res.json({ approved: false });
    }

    const approval = querySnapshot.docs[0].data();
    res.json({ approved: approval.approved, approval });
  } catch (error) {
    console.error('Approval status error:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, async () => {
  await authorizeB2();
  console.log(`Server running on port ${PORT}`);
});
