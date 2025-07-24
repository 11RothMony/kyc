# PRD: KYC Compare ID Card

## 1. Project Overview

**Project Name:** KYC Compare ID Card  
**Description:**  
A web-based application that enables users to verify their identity by comparing a real-time face scan with their uploaded ID card. The system will extract and display information from the ID card upon successful face match verification.

---

## 2. Goals and Objectives

- Allow users to upload an image of their ID card.
- Allow users to perform a live face scan using their device camera.
- Compare the live face with the face on the ID card using AI/ML or facial recognition API.
- Extract relevant data (name, DOB, ID number, etc.) from the ID card using OCR.
- Display extracted ID information only after successful verification.
- Ensure user data is handled securely and temporarily for verification purposes only.

---

## 3. Target Users

- Individuals or businesses that need to perform KYC verification for account creation or onboarding.

---

## 4. Features

### 4.1 User Interface (UI)
- Landing page with information and CTA.
- Upload ID card component (image file).
- Live camera capture for face scanning.
- Verification status screen.
- Display of extracted ID information upon match.

### 4.2 Functional Requirements
- [ ] Upload ID card (image).
- [ ] Capture live image using webcam.
- [ ] Compare faces using facial recognition API.
- [ ] Extract ID card data using OCR (e.g., Tesseract, AWS Textract).
- [ ] Display extracted ID data.
- [ ] Provide match/mismatch results to user.

### 4.3 Non-Functional Requirements
- Responsive design.
- Fast and accurate processing.
- Secure file handling and deletion after processing.
- Accessibility compliance.

---

## 5. Technology Stack

- **Frontend Framework:** [Next.js](https://nextjs.org/) (Page Router)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Language:** TypeScript
- **UI Components:** [ShadCN UI](https://ui.shadcn.com/)
- **Package Management:** Yarn Workspace (Monorepo setup)

---

## 6. Project Structure

Using a monorepo structure with Yarn Workspaces:

