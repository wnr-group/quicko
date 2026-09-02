# Quiko - Complete Screen List (End-to-End)

Based on our grilling session and design decisions, here's the COMPLETE list of screens needed.

---

## 📱 Total Screens: 28

### ✅ Already Done (10 screens):
1. Splash Screen ✅
2. Login ✅
3. OTP Verification ✅
4. Home (Role Selection) ✅
5. Create Package ✅
6. Browse Travelers ✅
7. Match Confirmed ✅
8. Chat ✅
9. [Next: Payment]
10. [Next: Complete the rest]

---

## 🆕 Screens We Still Need:

### **AUTHENTICATION & ONBOARDING (5 screens total)**
1. ✅ Splash Screen
2. ✅ Login (Phone Number)
3. ✅ OTP Verification
4. ⏳ **KYC Level 1** - Email verification
5. ⏳ **KYC Level 2** - Aadhaar verification (redirected to DigiLocker gateway)

### **PROFILE & SETTINGS (3 screens)**
6. ⏳ **Profile Setup** - Name, Photo, Basic Info
7. ⏳ **Dual Profile Selection** - Choose Sender or Traveler Profile
8. ⏳ **Profile View** - View/Edit your profile, ratings, history

### **HOME & NAVIGATION (1 screen)**
9. ✅ Home (Role Selection)

### **SENDER FLOW (9 screens)**
10. ✅ Create Package
11. ✅ Browse Travelers (List)
12. ⏳ **Traveler Detail View** - Full profile of specific traveler
13. ⏳ **Send Request** - Confirmation before sending request
14. ⏳ **My Requests** - List of pending/accepted requests
15. ✅ Match Confirmed
16. ⏳ **Payment** - UPI/Card payment with escrow
17. ✅ Chat
18. ⏳ **Track Package** - Real-time tracking view

### **PICKUP & VERIFICATION (2 screens)**
19. ⏳ **Pickup Confirmation** (Traveler) - Photo upload, terms
20. ⏳ **Package Verification Details** - Traveler verifies weight/dimensions

### **DELIVERY & COMPLETION (4 screens)**
21. ⏳ **Delivery Screen** (Traveler) - Receiver details, OTP entry
22. ⏳ **Receiver OTP Confirmation** - Success after OTP
23. ⏳ **Rating Screen** - Multi-criteria rating
24. ⏳ **Success/Completion** - Payment received / Package delivered

### **TRAVELER FLOW (7 screens)**
25. ⏳ **Create Trip** - Post journey details
26. ⏳ **Browse Packages** - List of available packages
27. ⏳ **Package Detail View** - Full details of specific package
28. ⏳ **Capacity Tracker** - Visual tracker of kg used/available
29. ⏳ **My Accepted Packages** - List of packages I'm carrying
30. ⏳ **Trip Timeline** - All pickups & deliveries for a trip
31. ⏳ **Earnings Dashboard** - Track payments, withdrawals

### **NOTIFICATIONS & ACTIVITY (2 screens)**
32. ⏳ **Notifications List** - All app notifications
33. ⏳ **Activity Feed** - Recent matches, requests, deliveries

### **SUPPORT & LEGAL (3 screens)**
34. ⏳ **Help & Support** - FAQs, Contact support
35. ⏳ **Terms & Conditions** - Legal text
36. ⏳ **Prohibited Items List** - What cannot be sent

### **ERROR & EDGE CASES (3 screens)**
37. ⏳ **No Results Found** - Empty state for browse screens
38. ⏳ **No-Show Report** - Report sender/traveler no-show
39. ⏳ **Error Screen** - Generic error handling

---

## 🎯 Priority Order for Design:

### **PHASE 1 - Core MVP (Must Have)** - 18 screens
Focus: Complete one user journey end-to-end

**Authentication:**
1. ✅ Splash
2. ✅ Login
3. ✅ OTP
4. KYC Email
5. KYC Aadhaar

**Sender Journey:**
6. Profile Setup
7. ✅ Home
8. ✅ Create Package
9. ✅ Browse Travelers
10. Traveler Detail
11. ✅ Match Confirmed
12. Payment
13. ✅ Chat
14. Track Package

**Traveler Actions:**
15. Pickup Confirmation
16. Delivery OTP
17. Rating
18. Success

### **PHASE 2 - Traveler Flow** - 7 screens
19. Create Trip
20. Browse Packages
21. Package Detail
22. Capacity Tracker
23. My Accepted Packages
24. Earnings Dashboard
25. Trip Timeline

### **PHASE 3 - Supporting Features** - 8 screens
26. Profile View
27. Dual Profile Selection
28. My Requests
29. My Accepted Packages
30. Notifications
31. Help & Support
32. No Results (Empty state)
33. Error Screen

### **PHASE 4 - Legal & Polish** - 3 screens
34. Terms & Conditions
35. Prohibited Items
36. No-Show Report

---

## 📋 Decision: What Order Should We Design?

**Option A: Priority Order (Recommended)**
- Complete Phase 1 (18 screens) = Full sender journey
- Then Phase 2 (7 screens) = Full traveler journey
- Then supporting features

**Option B: By Feature Type**
- All auth screens first
- All list screens together
- All detail screens together
- All forms together

**Option C: Parallel Flows**
- Sender AND Traveler flows simultaneously
- Keep both user types in mind

---

## 🤔 Your Decision Needed:

1. **Should we continue with the remaining sender flow screens next?**
   - Payment → Pickup Confirmation → Delivery → Rating → Success
   - This completes the full sender experience

2. **Or should we add KYC screens first?**
   - KYC Email → KYC Aadhaar
   - Then continue sender flow

3. **Or should we jump to traveler flow?**
   - Create Trip → Browse Packages → etc.

**Tell me which path you want to take!**

---

## ⏭️ READY: Next Screen Prompt

When you say "next", I'll give you whichever screen you choose:

**A)** Continue Sender Flow: **Payment Screen**  
**B)** Go back and add: **KYC Screens**  
**C)** Jump to Traveler: **Create Trip Screen**  
**D)** Add Support: **Profile Setup Screen**

**Which letter? A, B, C, or D?**
