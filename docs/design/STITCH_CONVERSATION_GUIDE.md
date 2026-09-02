# Quiko → Google Stitch: Step-by-Step Conversation Guide

**How to use**: Copy each prompt below and paste into Stitch as a conversation. Start from Step 1 and go sequentially.

---

## 🎯 STEP 1: Introduce the Project

**You say to Stitch:**
```
I'm building a mobile app called "Quiko" - a peer-to-peer package delivery platform. 

The concept: Travelers going from City A to City B can earn money by carrying packages for senders who need to send items on the same route. It's faster and cheaper than traditional couriers, and more sustainable.

I need you to design all the mobile app screens for both user types:
1. Senders (people who need to send packages)
2. Travelers (people who carry packages during their trips)

The app has a distinctive brand identity:
- Primary color: Bright yellow (#FFD93D) - representing speed and energy
- Secondary color: Deep black (#1A1A1A) - representing trust and professionalism
- Style: Modern, clean, mobile-first

Platform: iOS and Android mobile apps

Are you ready to help me design this?
```

**Wait for Stitch to respond, then continue...**

---

## 🎨 STEP 2: Set Global Design Standards

**You say to Stitch:**
```
Great! Before we start with individual screens, let me give you the design foundation that should apply to ALL screens:

COLORS:
- Primary: #FFD93D (bright yellow) - for buttons, highlights, headers
- Secondary: #1A1A1A (black) - for text, secondary buttons
- Background: White (#FFFFFF)
- Gray scale: Light grays for borders and subtle backgrounds
- Success: #4CAF50 (green)
- Error: #F44336 (red)

TYPOGRAPHY:
- Use system fonts (San Francisco for iOS, Roboto for Android style)
- Heading sizes: 24-32px, bold
- Body text: 16px, regular weight
- Small text/captions: 13-14px

COMPONENTS:
- Buttons: 48px height minimum (for easy tapping), rounded corners 12px
- Input fields: 48px height, 2px border, rounded 12px
- Cards: White background, subtle shadow, rounded 16px, 2px border
- Icons: 24px for standard size, 48px for hero/emphasis

SPACING:
- Page padding: 20px on left/right
- Between elements: 16px typically
- Between sections: 32px

LAYOUT:
- Mobile-first (design for 375px width, iPhone standard)
- Headers: 60px height, yellow background
- Single column layout (no complex multi-column grids)

Does this make sense? Should we start designing the first screen?
```

---

## 📱 STEP 3: Design Splash Screen

**You say to Stitch:**
```
Perfect! Let's start with the SPLASH SCREEN (the first screen users see when opening the app).

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

**After Stitch generates it:**
- Review the design
- Ask for adjustments if needed: "Can you make the logo bigger?" or "Add more spacing between elements"

---

## 🔐 STEP 4: Design Login Screen

**You say to Stitch:**
```
Great! Now let's design the LOGIN SCREEN (where users enter their phone number).

Screen name: Login

HEADER (yellow background, 60px height):
- Left: Back arrow icon (← black, 24px)
- Center: "Login" text (20px, bold, black)
- Right: Empty space (for balance)

CONTENT AREA (white background, centered):

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

## 📱 STEP 5: Design OTP Verification Screen

**You say to Stitch:**
```
Excellent! Next is the OTP VERIFICATION screen (where users enter the 4-digit code).

Screen name: OTP Verification

HEADER (same as login):
- Back arrow (left), "Enter OTP" title (center), yellow background

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

Can you create this OTP screen?
```

---

## 🏠 STEP 6: Design Home Screen (Role Selection)

**You say to Stitch:**
```
Perfect! Now the HOME SCREEN (where users choose their role: send or carry packages).

Screen name: Home / Role Selection

HEADER (yellow background):
- Left: Text "Welcome, User! 👋" (20px, bold, black)
- Right: Small "Logout" button (black background, yellow text, rounded, 30px height)
- Padding: 20px, height: 60px

CONTENT (two large cards):

CARD 1 - SEND A PACKAGE (first card):
- Background: Yellow (#FFD93D)
- Padding: 40px 20px
- Border radius: 20px
- Content (centered):
  - Icon: 📦 (48px emoji)
  - Title: "Send a Package" (24px, bold, black)
  - Subtitle: "Find travelers going your route" (14px, black with 80% opacity)
- Spacing from top: 20px
- Margin bottom: 20px
- Full width (minus 20px padding on each side)

CARD 2 - CARRY PACKAGES (second card):
- Background: Black (#1A1A1A)
- Padding: 40px 20px
- Border radius: 20px
- Content (centered):
  - Icon: ✈️ (48px emoji)
  - Title: "Carry Packages" (24px, bold, yellow)
  - Subtitle: "Earn money on your trip" (14px, yellow with 80% opacity)
- Full width (minus 20px padding on each side)

Both cards should be clickable/tappable with hover effect

Style: Bold, clear choices, visually distinct options
Page background: White
Overall padding: 20px

Can you design this home screen with two option cards?
```

---

## 📦 STEP 7: Design Create Package Screen

**You say to Stitch:**
```
Great! Now let's design the CREATE PACKAGE screen (form where senders post their package details).

Screen name: Create Package

HEADER (yellow background):
- Back arrow (left), "Create Package" title (center)

CONTENT (scrollable form with fields):

1. FROM LOCATION:
   - Label: "📍 From" (14px, semi-bold)
   - Input: Default value "Chennai", editable
   - Height: 48px, border, rounded 12px

2. TO LOCATION:
   - Label: "📍 To"
   - Input: Default value "Mumbai"
   - Same styling as above

3. TRAVEL DATE:
   - Label: "📅 Travel Date"
   - Date picker input
   - Shows: "July 17, 2026" format

4. TWO-COLUMN ROW (50% width each):
   - Left column:
     - Label: "⚖️ Weight (kg)"
     - Input: Placeholder "3"
   - Right column:
     - Label: "💰 Value (₹)"
     - Input: Placeholder "2000"
   - Gap: 12px between columns

5. THREE-COLUMN ROW (33% width each):
   - Column 1: Label "📏 L (cm)", Input "30"
   - Column 2: Label "W (cm)", Input "30"
   - Column 3: Label "H (cm)", Input "30"
   - Gap: 8px between columns
   - Smaller input height: 44px

6. CATEGORY DROPDOWN:
   - Label: "📦 Category"
   - Dropdown showing options:
     👕 Clothes, 📚 Books, 📱 Electronics, 🍫 Food, 🎁 Gifts, 📄 Documents

7. PRICE DISPLAY CARD (special card):
   - Background: Black (#1A1A1A)
   - Padding: 20px
   - Border radius: 16px
   - Content:
     - "Calculated Max Price" (small yellow text, 14px)
     - "₹283" (large yellow text, 32px, bold)
     - "You can offer up to this amount" (small yellow text, 13px)
   - Margin: 20px top/bottom

8. OFFER SLIDER:
   - Label: "Your Offer"
   - Slider (range 150 to 283)
   - Display value: "₹250" (24px, bold, centered, below slider)
   - Yellow slider track

9. FIND TRAVELERS BUTTON (sticky at bottom):
   - Text: "Find Travelers"
   - Yellow, full width, 48px height

Spacing: 20px between each field
Form padding: 20px sides
Style: Clean form, clear hierarchy

This is a longer screen with scrolling. Can you design this package creation form?
```

---

## 👥 STEP 8: Design Browse Travelers List

**You say to Stitch:**
```
Excellent! Now the BROWSE TRAVELERS screen (list of available travelers ranked by trust score).

Screen name: Browse Travelers

HEADER (yellow):
- Back arrow (left), "Available Travelers" (center), Filter icon 🔍 (right)

SUB-HEADER INFO:
- Text: "3 travelers match your route"
- Font: 14px, gray color
- Background: White
- Padding: 16px 20px

TRAVELER CARDS (repeat this card design 3 times):

Each TRAVELER CARD:
- White background
- Border: 2px solid light gray (#EEEEEE)
- Border radius: 16px
- Shadow: Subtle (0 2px 8px rgba(0,0,0,0.1))
- Padding: 20px
- Margin bottom: 16px

Card Structure:
1. HEADER ROW:
   - Left: Name "Raj Kumar" (18px, bold, black)
   - Right: Badge "✓ Verified" (green background #4CAF50, white text, 12px, rounded pill)

2. RATING ROW (below name):
   - Yellow star ⭐ + "4.8" + gray text "(35 trips)"
   - Font: 14px
   - Spacing: 8px below name

3. INFO ROWS (icon + text format):
   Each row with icon (20px) on left, text (14px, gray) on right:
   - ✈️ Flight | Chennai → Mumbai
   - 📅 July 17, 2026
   - ⚖️ Capacity: 10kg
   - ⏰ Pickup: 10am - 1pm
   - Gap: 8px between rows

4. ACTION BUTTON (at bottom of card):
   - Text: "Send Request"
   - Yellow background, black text
   - Smaller size: width auto, padding 10px 20px, height 36px
   - Border radius: 12px

CARD VARIATIONS:
- Card 1 (top): "Raj Kumar", 4.8 rating, ✈️ Flight
- Card 2 (middle): "Priya Sharma", 4.6 rating, 🚂 Train
- Card 3 (bottom): "Vikram Singh", 4.9 rating, ✈️ Flight

Style: Scannable list, clear information hierarchy
Page padding: 20px sides
Background: White

Can you design this travelers list screen with 3 traveler cards?
```

---

## 🎉 STEP 9: Design Match Confirmed (Celebration)

**You say to Stitch:**
```
Perfect! Now the MATCH CONFIRMED screen (celebration when sender & traveler connect).

Screen name: Match Confirmed

NO HEADER (full screen)

CONTENT (centered vertically):

1. CELEBRATION SECTION (top):
   - Large icon: 🎉 (80px size)
   - Should have slight animation feel (scale/bounce)
   - Spacing: 60px from top

2. HEADING:
   - Text: "It's a Match!"
   - Font: 28px, bold, black
   - Centered
   - Spacing: 20px below icon

3. SUBTEXT:
   - Text: "You've been matched with Raj Kumar"
   - Font: 16px, gray color
   - Centered
   - Spacing: 8px below heading

4. DETAILS CARD (main info):
   - White background
   - Border: 2px solid light gray
   - Border radius: 16px
   - Shadow: Medium (0 4px 12px rgba(0,0,0,0.1))
   - Padding: 20px
   - Margin: 40px top, 20px sides
   
   Card Content:
   - Card title: "Traveler Details" (18px, bold)
   - Info rows (with icons, 16px):
     - 👤 Raj Kumar
     - ⭐ 4.8 rating
     - 📅 July 17, 2026
     - ⏰ Pickup: 10am - 1pm
     - 💰 Amount: ₹250
   - Gap: 12px between rows

5. PRIMARY BUTTON (below card):
   - Text: "Pay ₹250 Now"
   - Yellow background, black text
   - Full width (minus 20px padding), 48px height
   - Border radius: 12px
   - Margin top: 20px

6. HELPER TEXT (below button):
   - Line 1: "Secure escrow payment"
   - Line 2: "You'll get 100% refund if cancelled >24hrs before"
   - Font: 13px, gray, centered
   - Line height: 18px
   - Margin top: 12px

Style: Celebratory, trustworthy, emphasizes the "match"
Background: White
Overall feel: Exciting but professional

Can you design this match confirmation screen?
```

---

## 💬 STEP 10: Design Chat Screen

**You say to Stitch:**
```
Great! Now the CHAT screen (where sender & traveler communicate).

Screen name: Chat

HEADER (yellow background, 60px):
- Back arrow (left)
- Contact name: "Raj Kumar" (center, bold, 20px)
- Profile icon 👤 (right, 24px)

CHAT MESSAGES AREA (white background, scrollable):

Show 3 sample messages alternating:

MESSAGE 1 (Received - left aligned):
- Background: Light gray (#F5F5F5)
- Text: "Hi Ananya! I'll be picking up your package on July 17th."
- Text color: Black, 16px
- Border radius: 16px (except bottom-left corner: 4px for speech bubble effect)
- Max width: 70% of screen
- Padding: 12px 16px
- Timestamp below: "9:30 AM" (11px, gray)

MESSAGE 2 (Sent - right aligned):
- Background: Yellow (#FFD93D)
- Text: "Great! Can we meet at T Nagar junction at 11:30am?"
- Text color: Black, 16px
- Border radius: 16px (except bottom-right corner: 4px)
- Max width: 70%
- Padding: 12px 16px
- Timestamp below: "9:32 AM" (11px, gray)
- Aligned to right side

MESSAGE 3 (Received - left aligned):
- Same style as Message 1
- Text: "Perfect! I'll be wearing a blue shirt. See you then."
- Timestamp: "9:35 AM"

QUICK ACTIONS ROW (above input bar):
- Horizontal scrollable row of pills:
  - "📍 I'm here"
  - "⏰ Running late"
  - "❓ Can't find you"
  - "📞 Call"
- Each pill:
  - Background: Light gray (#F5F5F5)
  - Padding: 8px 16px
  - Border radius: 20px (full pill shape)
  - Font: 13px
  - Gap: 8px between pills

INPUT BAR (bottom, sticky):
- Background: Light gray (#F5F5F5)
- Height: 60px
- Padding: 8px 12px
- Layout: Horizontal
  - Left: Text input (rounded 20px, white background, "Type a message...")
  - Right: Send button (yellow circle, 40px diameter, ➤ arrow icon centered)
  - Gap: 8px

Style: Clean messaging interface, WhatsApp-inspired
Message spacing: 12px between messages
Page background: White

Can you design this chat interface?
```

---

## 🎯 That's the Core Flow!

After these 10 screens, you have the main user journey. You can continue with:

**STEP 11**: Payment screen (form with UPI/Card options)
**STEP 12**: Pickup confirmation (photo upload + checkbox)
**STEP 13**: Delivery OTP screen (4 boxes like login OTP)
**STEP 14**: Rating screen (5 stars + comment box)
**STEP 15**: Success screen (checkmark + celebration)

---

## 💡 Tips for Using This Guide:

1. **Go in order** - Each screen builds context for the next
2. **Wait for Stitch** to generate each screen before moving to the next
3. **Review & refine** - Ask for adjustments: "Make the button larger" or "Use a different shade of yellow"
4. **Save outputs** - Download/export each screen as you go
5. **Stay conversational** - Stitch works best with natural language

---

## 🔄 If Stitch Gets Confused:

**Reset by saying:**
```
Let's refocus. I need you to design [screen name] for the Quiko mobile app.
Remember: Yellow (#FFD93D) primary color, Black (#1A1A1A) text, 48px button height, 12px border radius, clean modern style.

[Then repeat the specific screen prompt]
```

---

## 📤 After You're Done:

1. Export all screens from Stitch
2. Compile into a Figma file (or presentation)
3. Share with developers using our DESIGN_SYSTEM.md for implementation specs
4. Reference quiko-prototype/ HTML version for interactions

---

**You're ready!** Start with Step 1 and have a conversation with Stitch. Good luck! 🚀
