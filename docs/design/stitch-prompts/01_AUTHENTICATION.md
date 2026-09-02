# Section 1: Authentication & Onboarding (5 Screens)

**Paste the Global Style Guide first, then use these prompts in order.**

---

## SCREEN 1: Splash Screen

**Stitch Prompt:**
```
Design a mobile app splash screen for "Quiko" - a package delivery platform.

Screen name: Splash / Welcome Screen

Layout (centered vertically):

1. LOGO (top third of screen):
   - Large circle: 120px diameter
   - Background: Yellow (#FFD93D)
   - Contains: Black letter "Q" (48px, bold, centered)

2. APP NAME (below logo):
   - Text: "Quiko"
   - Size: 32px, bold, black color
   - Spacing: 20px below logo

3. TAGLINE (below name):
   - Text: "Just Quick As That ⚡"
   - Size: 14px, gray color, italic style
   - Spacing: 8px below name

4. GET STARTED BUTTON (bottom of screen):
   - Text: "Get Started"
   - Full width (minus 20px padding on each side)
   - Height: 48px
   - Background: Yellow (#FFD93D)
   - Text: Black, 16px, semi-bold
   - Border radius: 12px
   - Position: 40px from bottom of screen

Background: White
Overall feel: Clean, energetic, welcoming

Can you generate this splash screen design?
```

---

## SCREEN 2: Login

**Stitch Prompt:**
```
Design a mobile login screen for Quiko app.

Screen name: Login

HEADER (yellow background, 60px height):
- Back arrow (top-left, 24px, black)
- "Login" title (center, bold 20px, black)

CONTENT (centered):

1. LOGO (smaller version):
   - Circle: 80px diameter
   - Yellow background, black "Q"
   - Centered horizontally
   - 40px from top of content area

2. FORM SECTION (below logo, 30px spacing):
   
   Phone Input:
   - Label: "Phone Number" (14px, semi-bold, black, left-aligned)
   - Input field:
     - Placeholder text: "+91 98765 43210" (gray)
     - Height: 48px
     - Border: 2px solid light gray (#E0E0E0)
     - Border radius: 12px
     - Padding: 14px inside
     - Full width (minus 20px on each side)

3. SEND OTP BUTTON (below input, 24px spacing):
   - Text: "Send OTP"
   - Yellow background, black text
   - Full width, 48px height, rounded 12px

4. HELPER TEXT (below button, 20px spacing):
   - Text: "New user? OTP will create your account"
   - Size: 13px, gray color, centered
   - Line height: 18px

Overall padding: 20px on all sides
Style: Clean, trustworthy, simple

Can you design this login screen?
```

---

## SCREEN 3: OTP Verification

**Stitch Prompt:**
```
Design a mobile OTP verification screen.

Screen name: OTP Verification

HEADER (yellow background, 60px):
- Back arrow (left, 24px, black)
- "Enter OTP" title (center, 20px, bold, black)

CONTENT (centered vertically and horizontally):

1. INSTRUCTION TEXT (top):
   - Text: "Enter the 4-digit code sent to"
   - Second line: "+91 98765 43210" (bold)
   - Size: 14px, gray color, centered
   - Spacing: 30px from header

2. OTP INPUT BOXES (main focus):
   - 4 square boxes in a horizontal row
   - Each box:
     - Size: 56px × 56px
     - Border: 2px solid light gray
     - Border radius: 12px
     - Gap between boxes: 12px
   - Inside each box:
     - Large single digit (24px, bold, centered)
     - Placeholder: Empty
   - Active/focused box: Border changes to yellow
   - Spacing: 40px from instruction text

3. VERIFY BUTTON (below OTP boxes):
   - Text: "Verify"
   - Yellow background, black text
   - Full width, 48px height, rounded 12px
   - Spacing: 30px below OTP boxes

4. RESEND LINK (bottom):
   - Text: "Didn't receive? " (gray, 13px) + "Resend OTP" (black, bold)
   - Clickable text style
   - Centered
   - Spacing: 20px below button

Style: Focused, minimal distractions
Focus: The OTP boxes should be the visual center
Background: White

Can you create this OTP screen?
```

---

## SCREEN 4: Email Verification (KYC Level 1)

**Stitch Prompt:**
```
Design a mobile email verification screen for KYC Level 1.

Screen name: Email Verification

HEADER (yellow background):
- Back arrow (left)
- "Verify Email" title (center)

CONTENT (centered):

1. ILLUSTRATION (top):
   - Icon: 📧 (64px, email icon)
   - Centered
   - Margin: 40px from top

2. HEADING:
   - Text: "Verify Your Email" (24px, bold, black)
   - Subtext: "Complete Level 1 verification" (14px, gray)
   - Centered
   - Spacing: 20px below icon

3. INFO BOX:
   - Background: Light yellow (#FFF9E6)
   - Border: 1px solid yellow
   - Border radius: 12px
   - Padding: 16px
   - Margin: 30px from heading
   
   Content:
   - Text: "Email verification allows you to:" (14px, semi-bold, black)
   - Bullet points (13px, black):
     - "• Browse packages and travelers"
     - "• View pricing and routes"
     - "• Explore how Quiko works"
   - Line height: 22px

4. EMAIL INPUT:
   - Label: "Email Address" (14px, semi-bold, black, left-aligned)
   - Input field:
     - Placeholder: "your.email@example.com"
     - Height: 48px
     - Border: 2px solid light gray
     - Border radius: 12px
     - Full width
   - Margin: 24px below info box

5. SEND VERIFICATION BUTTON:
   - Text: "Send Verification Link"
   - Yellow background, black text
   - Full width, 48px height, rounded 12px
   - Margin top: 20px

6. HELPER TEXT (bottom):
   - Text: "Check your inbox and click the link to verify" (13px, gray, centered)
   - Margin top: 16px

Style: Informative, encouraging
Background: White

Can you design this email verification screen?
```

---

## SCREEN 5: Aadhaar Verification (KYC Level 2)

**Stitch Prompt:**
```
Design a mobile Aadhaar verification screen (DigiLocker integration) for KYC Level 2.

Screen name: Aadhaar Verification

HEADER (yellow background):
- Back arrow (left)
- "Aadhaar Verification" title (center)
- Close X (right)

CONTENT (scrollable):

1. HERO SECTION (top):
   - Icon: 🔒 (64px)
   - Heading: "Verify Your Identity" (24px, bold, black)
   - Subtext: "Complete Level 2 verification to transact" (14px, gray)
   - Centered
   - Margin: 30px from top

2. BENEFITS CARD:
   - Background: White
   - Border: 2px solid yellow
   - Border radius: 16px
   - Padding: 20px
   - Shadow: subtle
   - Margin: 20px
   
   Content:
   - Title: "Unlock with Level 2:" (16px, bold, black)
   - Benefits list (14px, black):
     - "✅ Create package postings"
     - "✅ Post travel trips"
     - "✅ Send and receive packages up to ₹5,000"
     - "✅ Chat with matched users"
   - Gap: 10px between items

3. SECURITY INFO:
   - Background: Light blue (#E3F2FD)
   - Border: 1px solid blue
   - Border radius: 12px
   - Padding: 16px
   - Margin: 20px
   
   Content:
   - Icon: 🛡️ (24px)
   - Heading: "Secure & Private" (14px, bold, black)
   - Bullet points (13px, black):
     - "• Verified via DigiLocker (Government of India)"
     - "• Your Aadhaar details are encrypted"
     - "• We only verify your identity, not store Aadhaar number"
   - Line height: 20px

4. DIGILOCKER LOGO (visual trust):
   - Official DigiLocker logo (placeholder: gray box 120px × 40px)
   - Text below: "Powered by Digital India" (12px, gray)
   - Centered
   - Margin: 20px

5. VERIFY BUTTON (sticky bottom):
   - Text: "Verify with DigiLocker"
   - Background: Yellow
   - Text: Black, bold
   - Full width (minus 40px padding), height: 52px
   - Border radius: 12px
   - Margin: 20px
   - Icon: 🔐 (left side of text)

6. SKIP LINK (below button):
   - Text: "Skip for now" (14px, gray, underlined, centered)
   - Margin: 12px below button
   - Warning: "(You can only browse, not transact)" (12px, light gray)

Style: Trustworthy, official, secure
Background: White
Focus: Government verification = trust

Can you design this Aadhaar verification screen?
```

---

**✅ Section 1 Complete: 5 Screens**

Next section: `02_PROFILE_SETUP.md`
