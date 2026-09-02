# Quiko - Google Stitch Prompts Guide

**Purpose**: Copy these prompts into Google Stitch to generate production-ready mobile UI designs

**Stitch URL**: https://stitch.withgoogle.com/

---

## 🎨 Design Foundation (Use for ALL Screens)

**Global Style Instructions:**
```
Brand: Quiko - peer-to-peer package delivery app
Platform: Mobile app (iOS/Android)
Primary Color: #FFD93D (bright yellow)
Secondary Color: #1A1A1A (deep black)
Background: White
Accent Colors: 
  - Success: #4CAF50 (green)
  - Error: #F44336 (red)

Typography:
  - Headings: Bold, 24-32px
  - Body: Regular, 16px
  - System font (San Francisco/Roboto)

Components Style:
  - Border Radius: 12px (buttons, cards, inputs)
  - Button Height: 48px minimum
  - Card Shadow: Subtle (0 2px 8px rgba(0,0,0,0.1))
  - Icon Size: 24px for standard, 48px for hero

Spacing:
  - Page padding: 20px
  - Element gaps: 16px
  - Section breaks: 32px
```

---

## Screen 1: Splash Screen

**Stitch Prompt:**
```
Design a mobile app splash screen for "Quiko" - a package delivery platform.

Layout (centered, vertical):
- Large circular logo (120px diameter)
  - Yellow background (#FFD93D)
  - Black letter "Q" (bold, 48px)
- App name "Quiko" below logo (32px, bold, black)
- Tagline "Just Quick As That ⚡" (14px, gray, italic)
- Primary button at bottom: "Get Started" (yellow background, black text, 48px height, full width, rounded 12px)

Style: Modern, minimal, energetic
Background: White
Spacing: 40px between elements
```

---

## Screen 2: Login

**Stitch Prompt:**
```
Design a mobile login screen for Quiko app.

Header:
- Back arrow (top-left, 24px)
- "Login" title (center, bold 20px)

Content (centered):
- Small Quiko logo (80px circular, yellow background, "Q")
- Phone number input field:
  - Label: "Phone Number" (14px, semi-bold)
  - Input: Placeholder "+91 98765 43210" (16px)
  - Border: 2px gray, rounded 12px
  - Height: 48px
- Primary button: "Send OTP" (yellow, black text, full width, rounded 12px, 48px height)
- Helper text below: "New user? OTP will create your account" (13px, gray, centered)

Style: Clean, simple, trustworthy
Background: White
Padding: 20px sides
```

---

## Screen 3: OTP Verification

**Stitch Prompt:**
```
Design a mobile OTP verification screen.

Header:
- Back arrow (left)
- "Enter OTP" title (center)

Content (centered):
- Instruction text: "Enter the 4-digit code sent to +91 98765 43210" (14px, gray, centered)
- 4 OTP input boxes in a row:
  - Size: 56px × 56px each
  - Border: 2px gray, rounded 12px
  - Gap: 12px between boxes
  - Large number inside (24px, bold)
- Primary button: "Verify" (yellow, below OTP boxes, full width)
- Link text below: "Didn't receive? Resend OTP" (13px, black text, bold "Resend OTP")

Style: Simple, focused
Background: White
Spacing: 30px between sections
```

---

## Screen 4: Home (Role Selection)

**Stitch Prompt:**
```
Design a mobile home screen with two large action cards.

Header:
- "Welcome, User! 👋" (left, 20px bold)
- "Logout" button (right, small, black background, yellow text)
- Background: Yellow (#FFD93D)
- Padding: 20px

Content:
Two large cards stacked vertically:

Card 1:
- Background: Yellow (#FFD93D)
- Icon: 📦 (48px emoji)
- Title: "Send a Package" (24px, bold, black)
- Subtitle: "Find travelers going your route" (14px, black, 80% opacity)
- Padding: 40px 20px
- Border radius: 20px
- Margin bottom: 20px

Card 2:
- Background: Black (#1A1A1A)
- Icon: ✈️ (48px emoji)
- Title: "Carry Packages" (24px, bold, yellow)
- Subtitle: "Earn money on your trip" (14px, yellow, 80% opacity)
- Padding: 40px 20px
- Border radius: 20px

Style: Bold, clear choices
Overall padding: 20px
```

---

## Screen 5: Create Package Posting

**Stitch Prompt:**
```
Design a mobile form screen for creating a package delivery posting.

Header:
- Back arrow (left)
- "Create Package" title (center)
- Background: Yellow

Form Fields (vertical scroll):
1. From Location:
   - Label: "📍 From"
   - Input: "Chennai" (with border, rounded)

2. To Location:
   - Label: "📍 To"
   - Input: "Mumbai"

3. Travel Date:
   - Label: "📅 Travel Date"
   - Date picker input

4. Two columns (50/50):
   - Left: "⚖️ Weight (kg)" input
   - Right: "💰 Value (₹)" input

5. Three columns (33/33/33):
   - "📏 L (cm)" | "W (cm)" | "H (cm)"

6. Category Dropdown:
   - Label: "📦 Category"
   - Options: Clothes, Books, Electronics, etc.

7. Price Display Card:
   - Black background card
   - "Calculated Max Price" (small yellow text)
   - "₹283" (large yellow text, 32px)
   - "You can offer up to this amount" (small yellow text)

8. Offer Slider:
   - Label: "Your Offer"
   - Slider (150 to 283)
   - Large number display: "₹250" (24px, center)

Button at bottom:
- "Find Travelers" (yellow, black text, full width, sticky)

Style: Clean form, clear labels
Spacing: 20px between fields
Input height: 48px
Border radius: 12px
```

---

## Screen 6: Browse Travelers List

**Stitch Prompt:**
```
Design a mobile screen showing a list of available travelers.

Header:
- Back arrow (left)
- "Available Travelers" title (center)
- Filter icon 🔍 (right)
- Background: Yellow

Sub-header:
- Text: "3 travelers match your route" (14px, gray)
- Padding: 16px 20px

Traveler Cards (repeat 3 times):
Each card:
- White background
- Border: 2px gray, rounded 16px
- Shadow: subtle
- Padding: 20px
- Margin bottom: 16px

Card Content:
- Header row:
  - Name: "Raj Kumar" (18px, bold)
  - Badge: "✓ Verified" (green, small, top-right)
- Rating: ⭐ 4.8 (35 trips) (14px)
- Info rows (icon + text, 14px, gray):
  - ✈️ Flight | Chennai → Mumbai
  - 📅 July 17, 2026
  - ⚖️ Capacity: 10kg
  - ⏰ Pickup: 10am - 1pm
- Button: "Send Request" (yellow, small, bottom of card)

Style: Clean cards, scannable information
Ranking indicator: Top card slightly elevated
```

---

## Screen 7: Match Confirmed (Celebration)

**Stitch Prompt:**
```
Design a mobile celebration screen for successful match.

Content (centered, vertical):
- Large icon: 🎉 (80px, animated scale-in)
- Heading: "It's a Match!" (28px, bold, black)
- Subtext: "You've been matched with Raj Kumar" (16px, gray)
- Spacing: 40px top padding

Details Card:
- White card with border
- Title: "Traveler Details" (18px, bold)
- Info rows:
  - 👤 Raj Kumar
  - ⭐ 4.8 rating
  - 📅 July 17, 2026
  - ⏰ Pickup: 10am - 1pm
  - 💰 Amount: ₹250
- Padding: 20px
- Border radius: 16px
- Shadow: medium

Primary Button:
- "Pay ₹250 Now" (yellow, black text, full width)
- Helper text below: "Secure escrow payment" (13px, gray)
- "100% refund if cancelled >24hrs before" (13px, gray)

Style: Celebratory, trustworthy
Background: White
```

---

## Screen 8: Payment Screen

**Stitch Prompt:**
```
Design a mobile payment screen.

Header:
- Back arrow (left)
- "Payment" title (center)

Price Display (top):
- Black background card
- "Total Amount" (small yellow text)
- "₹250" (large yellow text, 32px)
- "Traveler gets ₹245 | Quiko ₹5 (2%)" (small yellow text)
- Border radius: 16px

Form Fields:
1. Payment Method Dropdown:
   - Label: "Payment Method"
   - Options: 💳 UPI, 💳 Credit/Debit Card, 💰 Wallet

2. UPI ID Input:
   - Label: "UPI ID"
   - Placeholder: "yourname@upi"

Security Info Box:
- Light gray background
- 🔒 "Safe & Secure" (bold)
- Bullet points:
  - Money held in escrow until delivery
  - 100% refund if cancelled >24hrs before
  - Traveler paid only after OTP
- Font: 13px
- Border radius: 12px
- Padding: 16px

Primary Button (sticky bottom):
- "Pay ₹250" (yellow, black text, full width)

Style: Secure, clear breakdown
Background: White
```

---

## Screen 9: Chat Screen

**Stitch Prompt:**
```
Design a mobile chat interface.

Header:
- Back arrow (left)
- Contact name: "Raj Kumar" (center, bold)
- Profile icon 👤 (right)
- Background: Yellow

Chat Messages Area:
- White background
- Messages alternating:

Received (left-aligned):
- Gray bubble (#F5F5F5)
- Black text
- Border radius: 16px (except bottom-left: 4px)
- Max width: 70%
- Timestamp below: "9:30 AM" (11px, gray)

Sent (right-aligned):
- Yellow bubble (#FFD93D)
- Black text  
- Border radius: 16px (except bottom-right: 4px)
- Max width: 70%
- Timestamp below: "9:32 AM" (11px, gray)

Quick Reply Buttons (above input):
- Horizontal scroll row
- Pills: "📍 I'm here" | "⏰ Running late" | "❓ Can't find you" | "📞 Call"
- Light gray background
- Border radius: 20px
- Padding: 8px 16px

Input Bar (bottom):
- Light gray background (#F5F5F5)
- Text input (rounded 20px, white, left)
- Send button (yellow circle, ➤ icon, right)
- Height: 44px

Style: Clean messaging interface
Spacing: 12px between messages
```

---

## Screen 10: Pickup Confirmation

**Stitch Prompt:**
```
Design a mobile pickup verification screen.

Header:
- Back arrow (left)
- "Confirm Pickup" title (center)

Content (scrollable):

Section 1 - Package Details Card:
- White card with border
- Title: "Package Details" (18px, bold)
- Info rows (icon + text):
  - ⚖️ Weight: 3kg
  - 📦 Dimensions: 30×30×30 cm
  - 💰 Declared Value: ₹2,000
  - 👕 Category: Clothes
- Border radius: 16px
- Shadow: subtle

Section 2 - Photo Upload:
- Label: "📸 Upload Package Photo"
- Large dashed border box (rectangular)
- 📷 Camera icon (48px, centered)
- Text: "Tap to take photo" (gray, centered)
- Height: 200px
- Border: 2px dashed gray
- Border radius: 12px

Section 3 - Terms Checkbox:
- Light gray box
- Checkbox + Text:
  "I verify that:
  • Package matches description
  • No prohibited items
  • I accept liability for declared value (₹2,000)"
- Font: 13px
- Padding: 16px

Primary Button (sticky bottom):
- "Confirm Pickup" (yellow, black text, full width)

Style: Verification-focused, checklist feel
```

---

## Screen 11: Delivery & OTP

**Stitch Prompt:**
```
Design a mobile delivery confirmation screen with OTP entry.

Content (centered, vertical):

Hero Icon:
- 📦 (80px emoji)
- Margin bottom: 20px

Heading:
- "Ready to Deliver" (24px, bold)
- Subtext: "Ask receiver for OTP to complete delivery" (16px, gray)

Receiver Card:
- White card with border
- Title: "Receiver Details"
- Info rows:
  - 👤 Meera Joshi
  - 📞 +91 98765 12345
  - 📍 Andheri West, Mumbai
- Border radius: 16px

OTP Section:
- Label: "Enter Receiver's OTP" (18px, bold, centered)
- 4 OTP boxes (same as login OTP):
  - 60px × 60px each
  - Border: 2px gray
  - Border radius: 12px
  - Gap: 12px
  - Large number (24px, bold)

Primary Button:
- "Complete Delivery" (yellow, full width)

Style: Final step emphasis, clear
Background: White
Spacing: 30px between sections
```

---

## Screen 12: Rating Screen

**Stitch Prompt:**
```
Design a mobile rating/review screen.

Content (centered, vertical):

Hero Section:
- ⭐ icon (80px)
- Heading: "Rate Your Experience" (24px, bold)
- Subtext: "How was your experience with Raj Kumar?" (16px, gray)
- Margin bottom: 40px

Star Rating:
- 5 large stars (40px each) in a row
- Spacing: 8px between stars
- Inactive: Light gray
- Active (on tap): Yellow (#FFD93D)
- Centered

Comment Box:
- Label: "Comments (Optional)" (14px, semi-bold)
- Textarea (multiline input):
  - Placeholder: "Share your experience..."
  - Height: 100px
  - Border: 2px gray
  - Border radius: 12px
  - Padding: 14px

Buttons:
- Primary: "Submit Rating" (yellow, full width)
- Secondary: "Skip" (outline, gray border, margin top 12px)

Style: Feedback-friendly, optional feel
Background: White
Spacing: 20px between elements
```

---

## Screen 13: Success Screen

**Stitch Prompt:**
```
Design a mobile success confirmation screen.

Content (centered, vertical):

Celebration:
- ✅ icon (80px, green, animated)
- Heading: "Success!" (28px, bold)
- Subtext: "Your package was delivered successfully" (16px, gray)
  OR "You earned ₹245!" (for traveler)
- Spacing: 40px top padding

Payment Card (for travelers only):
- Black background card
- "Payment Received" (small yellow text)
- "₹245" (large yellow text, 32px)
- "Added to your Quiko wallet" (small yellow text)
- Border radius: 16px
- Padding: 20px

Primary Button:
- "Back to Home" (yellow, black text, full width)

Style: Celebratory, completion
Background: White
Animation: Scale-in effect
```

---

## Screen 14: Browse Packages (Traveler View)

**Stitch Prompt:**
```
Design a mobile screen for travelers browsing packages.

Header:
- Back arrow (left)
- "Available Packages" title (center)
- Filter icon (right)
- Background: Yellow

Capacity Bar:
- Yellow info box
- Text: "Your capacity: 0kg / 10kg used" (bold)
- Progress bar visual
- Padding: 12px
- Border radius: 12px

Sub-header:
- "3 packages match your route" (14px, gray)

Package Cards (repeat 3):
Each card:
- White background, border, shadow
- Header:
  - "3kg - 👕 Clothes" (18px, bold)
  - Price badge: "₹250" (yellow, top-right)
- Sender info: "From Ananya Patel ⭐ 4.7" (14px)
- Info rows:
  - 📍 Chennai → Mumbai
  - 📅 July 17, 2026
  - 📦 30×30×30 | Value: ₹2,000
  - 📍 Pickup: T Nagar | Delivery: Andheri
- Button: "Send Request" (yellow, small)

Style: Information-dense, scannable
```

---

## Screen 15: Create Trip (Traveler)

**Stitch Prompt:**
```
Design a mobile form for travelers to post their trip.

Header:
- Back arrow (left)
- "Create Trip" title (center)
- Background: Yellow

Form Fields (scrollable):
1. From Location:
   - Label: "📍 From"
   - Input: "Chennai - T Nagar"

2. To Location:
   - Label: "📍 To"
   - Input: "Mumbai - Andheri"

3. Travel Date:
   - Label: "📅 Travel Date"
   - Date picker

4. Transport Mode:
   - Label: "✈️ Transport Mode"
   - Dropdown: ✈️ Flight | 🚂 Train | 🚌 Bus

5. Two columns:
   - Left: "⏰ Pickup Window" (e.g., "10am-1pm")
   - Right: "⏰ Delivery Window" (e.g., "6pm-9pm")

6. Two columns:
   - Left: "⚖️ Capacity (kg)" with helper text "Soft guideline"
   - Right: "📏 Max Size" dropdown (30×30×30, 40×40×40, 50×50×50)

Primary Button (sticky bottom):
- "Find Packages" (yellow, black text, full width)

Style: Clear form, travel-focused
Input styling: Same as package form
```

---

## 🎨 Design Tips for Stitch:

### After Generating Each Screen:

1. **Check Colors**: Ensure yellow is #FFD93D, black is #1A1A1A
2. **Verify Spacing**: 20px page padding, 16px between elements
3. **Button Size**: All buttons minimum 48px height
4. **Border Radius**: Consistent 12px for most elements
5. **Icons**: Use emojis or specify icon library (Lucide, Heroicons)
6. **Typography**: System fonts, 16px body, bold headings

### If Something Looks Off:

**Refine with follow-up prompts:**
- "Make the button more rounded"
- "Increase spacing between cards"
- "Use a bolder font for the heading"
- "Add more shadow to the card"
- "Make the yellow brighter"

---

## 📱 Screen Priority Order:

### Start with these FIRST (Core Flow):
1. ✅ Splash Screen
2. ✅ Login
3. ✅ Home
4. ✅ Create Package
5. ✅ Browse Travelers
6. ✅ Match Confirmed
7. ✅ Chat

### Then add these (Complete Flow):
8. Payment
9. Pickup Confirmation
10. Delivery
11. Rating
12. Success

### Finally (Traveler Flow):
13. Browse Packages
14. Create Trip

---

## 🚀 Next Steps After Stitch:

1. **Generate** all screens in Stitch
2. **Export** designs (Figma/PNG)
3. **Share** with developers
4. **Reference** DESIGN_SYSTEM.md for implementation details

---

## 💡 Pro Tips:

**Batch Similar Screens:**
- Do all "list/browse" screens together
- Do all "form/create" screens together
- Do all "confirmation" screens together

**Iterate Fast:**
- Generate v1 of all screens first
- Then refine details in second pass
- Don't aim for perfection on first try

**Save Prompts:**
- Keep track of what worked
- Refine prompts that didn't generate well
- Build a library of your best prompts

---

**Ready to use!** Copy any prompt above and paste into Google Stitch.

**Questions?** Refer to:
- DESIGN_SYSTEM.md (complete design specs)
- PRODUCT_SPEC.md (feature details)
- quiko-prototype/ (working HTML version)
