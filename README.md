# HerbRx - Herbal Remedy Prescription System

A full-stack web application that allows patients to receive detailed herbal remedy prescriptions for sicknesses they describe, based on a verified administrative database.

## Core Features
- **Patient Portal**: Registration, symptom search, detailed prescription generation, and history tracking.
- **Admin Portal**: Secure access to manage the herbal remedy database, view registered patients, and monitor prescription logs.
- **Detailed Remedies**: Every prescription includes dosage, preparation method, duration, and safety precautions.
- **Mobile Responsive**: Built with a mobile-first approach using Tailwind CSS.

## Tech Stack
- **Frontend**: React 19, Vite, Tailwind CSS, Lucide Icons, Framer Motion.
- **Backend**: Node.js + Express (serving the frontend and API).
- **Database/Auth**: Firebase (Firestore & Authentication).

## Setup & Running Locally

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Variables**:
   Create a `.env` file (or use the one automatically injected in AI Studio) with:
   - `GEMINI_API_KEY` (if using AI features in future versions)
   - Firebase configuration is loaded from `firebase-applet-config.json`

3. **Start the Application**:
   ```bash
   npm run dev
   ```
   The app will run at `http://localhost:3000`.

## Credentials for Testing

### Admin
- **Email**: `admin@example.com`
- **Password**: `admin123`
- *Note: On the Admin Login page, click "Seed Demo Admin Account" to automatically prepare the admin role in Firestore.*

### Sample Patient
1. Go to Patient Login -> Sign Up.
2. Enter your details to create a new patient profile.

## Administrative Functions
Once logged in as an admin, you can:
1. Click **"Seed Knowledge Base"** to populate the 5 sample remedies defined in the requirements.
2. Manually add, edit, or delete remedies.
3. View all patient activity and logs.
