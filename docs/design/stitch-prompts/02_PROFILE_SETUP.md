# Section 2: Profile & Setup (3 Screens)

**Screens 6-8**

---

## SCREEN 6: Profile Setup

**Stitch Prompt:**
```
Design a mobile profile setup screen for first-time user onboarding.

Screen name: Profile Setup

HEADER (yellow background):
- Back arrow (left)
- "Create Profile" title (center)
- "Skip" link (right, 14px, black)

CONTENT (scrollable form):

1. PROGRESS INDICATOR (top):
   - Text: "Step 1 of 2" (13px, gray, centered)
   - Progress bar: 50% filled (yellow bar, gray background)
   - Height: 4px, rounded
   - Margin: 16px (sides)

2. PROFILE PHOTO UPLOAD:
   - Large circular placeholder (100px diameter)
   - Background: Light gray (#F5F5F5)
   - Icon: 📷 (32px, centered, gray)
   - Text below: "Add Photo" (13px, black, underlined)
   - Centered horizontally
   - Margin: 30px from top

3. FORM FIELDS (vertical stack, 20px spacing):

   Field 1: Name
   - Label: "Full Name" (14px, semi-bold, black)
   - Input: Placeholder "Ananya Patel"
   - Height: 48px, border 2px gray, rounded 12px

   Field 2: Date of Birth
   - Label: "Date of Birth" (14px, semi-bold, black)
   - Date picker input
   - Placeholder: "DD / MM / YYYY"
   - Height: 48px

   Field 3: City
   - Label: "City" (14px, semi-bold, black)
   - Dropdown selector
   - Placeholder: "Select your city"
   - Options: Chennai, Mumbai, Delhi, Bangalore, etc.
   - Height: 48px

   Field 4: About (optional)
   - Label: "About You (Optional)" (14px, semi-bold, black)
   - Textarea: Placeholder "Tell others about yourself..."
   - Height: 80px, multiline
   - Border: 2px gray, rounded 12px

   Field 5: Language
   - Label: "Preferred Language" (14px, semi-bold, black)
   - Dropdown: English, हिन्दी, தமிழ், తెలుగు
   - Height: 48px

4. CONTINUE BUTTON (sticky bottom):
   - Text: "Continue"
   - Yellow background, black text
   - Full width (minus 40px padding), 48px height
   - Border radius: 12px
   - Margin: 20px

Style: Clean form, friendly onboarding
Background: White
Padding: 20px sides

Can you design this profile setup screen?
```

---

## SCREEN 7: Dual Profile Selection

**Stitch Prompt:**
```
Design a mobile screen for users to choose their role(s): Sender, Traveler, or Both.

Screen name: Dual Profile Selection

HEADER (yellow background):
- Back arrow (left)
- "Choose Your Profile" title (center)

CONTENT (centered):

1. HEADING SECTION:
   - Icon: 👤 (48px)
   - Heading: "How will you use Quiko?" (22px, bold, black)
   - Subtext: "You can always switch or enable both later" (14px, gray)
   - Centered
   - Margin: 40px from top

2. OPTION CARDS (vertical stack, 16px gap):

CARD 1: Sender Profile
- Background: Light yellow (#FFF9E6)
- Border: 3px solid yellow (if selected) or 2px light gray (unselected)
- Border radius: 16px
- Padding: 24px
- Tappable (radio button behavior)
- Margin: 0 20px

Content:
- Checkbox (top-right): Yellow circle with checkmark if selected
- Icon: 📦 (40px, left-aligned)
- Title: "I want to Send Packages" (18px, bold, black)
- Description: "Send packages with travelers going your route. Save 50-80% on delivery costs." (14px, gray)
- Line height: 20px

CARD 2: Traveler Profile
- Same styling as Card 1
- Background: Light gray (#F5F5F5) when unselected

Content:
- Checkbox (top-right)
- Icon: ✈️ (40px)
- Title: "I want to Carry Packages" (18px, bold, black)
- Description: "Earn ₹300-500 per trip by carrying packages in your spare luggage space." (14px, gray)

CARD 3: Both Profiles
- Same styling
- Background: White with yellow border when unselected

Content:
- Checkbox (top-right)
- Icons: 📦 + ✈️ (both 32px, side by side)
- Title: "Both - Send & Carry" (18px, bold, black)
- Description: "Maximum flexibility. Send when you need, earn when you travel." (14px, gray)
- Badge: "Recommended" (green pill, 11px, top-right)

3. INFO BOX (below cards):
   - Background: Light blue (#E3F2FD)
   - Border radius: 12px
   - Padding: 16px
   - Margin: 20px
   
   Content:
   - Icon: ℹ️ (20px)
   - Text: "You'll have separate ratings for sending and carrying packages" (13px, black)

4. GET STARTED BUTTON (sticky bottom):
   - Text: "Get Started"
   - Yellow background, black text
   - Full width (minus 40px), 52px height
   - Border radius: 12px
   - Margin: 20px
   - Disabled state: Gray if no selection made

Style: Clear choice, encouraging, flexible
Background: White

Can you design this profile selection screen?
```

---

## SCREEN 8: Profile View

**Stitch Prompt:**
```
Design a mobile profile view screen (user can view and edit their profile).

Screen name: Profile View

HEADER (yellow background):
- Back arrow (left)
- "Profile" title (center)
- Edit icon ✏️ (right, 24px, black)

CONTENT (scrollable):

1. PROFILE HEADER CARD:
   - Background: White
   - Padding: 24px 20px
   - Border bottom: 1px solid light gray
   
   Content (centered):
   - Profile photo: 100px circle
   - Name: "Ananya Patel" (22px, bold, black)
   - Member since: "Joined July 2026" (13px, gray)
   - Spacing: 8px between elements

2. PROFILE TABS (below header):
   - Two tabs: "Sender Profile" | "Traveler Profile"
   - Active tab: Yellow underline (3px thick)
   - Inactive: Gray text
   - Height: 48px
   - Background: White
   - Border bottom: 1px light gray

3. ACTIVE TAB CONTENT - SENDER PROFILE:

Stats Row (3 columns, equal width):
- Background: Light yellow (#FFF9E6)
- Padding: 20px
- Border bottom: 1px light gray

Column 1:
- Number: "12" (24px, bold, black)
- Label: "Sent" (13px, gray)

Column 2:
- Number: "4.7" (24px, bold, black)
- Icon: ⭐ (16px)
- Label: "Rating" (13px, gray)

Column 3:
- Number: "₹2,450" (24px, bold, black)
- Label: "Spent" (13px, gray)

4. VERIFICATION STATUS CARD:
   - Background: White
   - Border: 2px solid green
   - Border radius: 12px
   - Padding: 16px
   - Margin: 20px
   
   Content:
   - Heading: "Verification Level: 2" (16px, bold, black)
   - Badges (horizontal):
     - "✓ Email" (green pill)
     - "✓ Phone" (green pill)
     - "✓ Aadhaar" (green pill)
     - "○ PAN" (gray pill, incomplete)
   - Link: "Upgrade to Level 3 >" (14px, yellow, bold, underlined)

5. DETAILS SECTION:
   - Background: White
   - Padding: 20px
   
   Info rows (icon + label + value):
   - 📧 Email: "ananya@email.com"
   - 📞 Phone: "+91 98765 43210"
   - 🏙️ City: "Mumbai"
   - 🌐 Language: "English"
   - 📅 Date of Birth: "15 March 1996"
   
   Each row:
   - Height: 44px
   - Border bottom: 1px light gray
   - Font: 14px, gray label, black value

6. BIO SECTION:
   - Background: White
   - Padding: 20px
   - Border top: 1px light gray
   
   Content:
   - Label: "About" (14px, semi-bold, gray)
   - Text: "College student, love to travel and send care packages home!" (14px, black)
   - Line height: 22px

7. ACTION BUTTONS (bottom):
   - Background: White
   - Padding: 20px
   - Border top: 1px light gray
   
   Buttons (stacked, 12px gap):
   - "Edit Profile" (Yellow, full width, 48px)
   - "Settings" (White with border, full width, 48px)
   - "Logout" (Text only, red, centered, 36px)

Style: Clean profile card, informative
Background: Light gray (#FAFAFA)

Can you design this profile view screen?
```

---

**✅ Section 2 Complete: 3 Screens (Total: 8/50)**

Next section: `03_HOME_NAVIGATION.md`
