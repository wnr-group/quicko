# Quiko Mobile App - Product Specification

**Last Updated**: July 10, 2026  
**Version**: 1.0 MVP

---

## Executive Summary

Quiko is a peer-to-peer package delivery platform that connects people who need to send packages with travelers going on the same route. By leveraging existing travel journeys, Quiko provides faster, cheaper, and more sustainable delivery compared to traditional courier services.

**Tagline**: "Just Quick As That"

---

## Core Value Proposition

- **For Senders**: Save 50-80% on delivery costs, faster delivery than traditional couriers
- **For Travelers**: Earn ₹150-500+ per trip by utilizing spare luggage capacity
- **For Planet**: Reduce carbon footprint through shared mobility

---

## How It Works

### The Simple Flow

1. **Sender posts package**: "Need to send 3kg from Chennai to Mumbai on July 17th, offering ₹300"
2. **Traveler posts trip**: "Going Chennai to Mumbai on July 17th, can carry 10kg"
3. **System matches them**: Both get notified about the match
4. **They connect**: Chat, negotiate, confirm details
5. **Payment held in escrow**: Sender pays, Quiko holds the money
6. **Pickup**: Traveler meets sender, verifies package, photos taken
7. **Journey**: Traveler carries package on their flight/train/bus
8. **Delivery**: Receiver verifies with OTP, confirms receipt
9. **Payment released**: Traveler gets 98%, Quiko keeps 2% commission
10. **Ratings**: Both parties rate each other

---

## User Personas

### Persona 1: Ananya (The Student Sender)
- **Age**: 20, Student in Mumbai
- **Need**: Send affordable packages to family
- **Pain Point**: Traditional couriers too expensive (₹400-750 for 1kg)
- **Quiko Solution**: Send same package for ₹150-200

### Persona 2: Raj (The Traveler)
- **Age**: 28, Frequent business traveler
- **Need**: Earn extra income during trips
- **Pain Point**: Empty luggage space going to waste
- **Quiko Solution**: Earn ₹300-500 per trip for carrying packages

### Persona 3: Priya (The Receiver)
- **Age**: 45, Working professional
- **Need**: Receive packages quickly and reliably
- **Pain Point**: Traditional couriers take 24-36 hours
- **Quiko Solution**: Same-day delivery via flight travelers

---

## Key Features

### 1. Dual-Profile System
- Single account, two separate profiles
- **Sender Profile**: For posting packages, separate rating/history
- **Traveler Profile**: For posting trips, separate rating/history
- Shared KYC, payment methods, wallet

### 2. Smart Matching Algorithm
Travelers ranked by:
- Trust Score (Rating × Delivery count)
- Transport mode (Flight > Train > Bus for speed)
- Pickup distance from sender
- Verification level

### 3. Dynamic Pricing Formula

```
Max Price = ₹30 + (Weight_kg × Distance_km × ₹0.03) × Time_Multiplier + Volume_Surcharge

Time Multipliers:
- Same day: 1.8x
- Next day: 1.3x
- Flexible (2-3 days): 1.0x

Volume Surcharge:
- Small (≤30×30×30 cm): ₹0
- Medium (≤40×40×40 cm): +₹20
- Large (≤50×50×50 cm): +₹50

Value Tiers (Risk-based pricing):
- Package value up to ₹2,000: Base price
- ₹2,001-₹5,000: Base + ₹30
- ₹5,001-₹10,000: Base + ₹80
```

**Example Calculations**:
- 1kg, Chennai → Mumbai (1360km), next day, 30×30×30, value ₹2000
  - = ₹30 + (1 × 1360 × ₹0.03) × 1.3 + ₹0 = **₹83**
  - Compare: DTDC ₹400, Blue Dart ₹750 ✅

- 5kg, Delhi → Mumbai (1400km), same day, 40×40×40, value ₹8000
  - = ₹30 + (5 × 1400 × ₹0.03) × 1.8 + ₹20 + ₹80 = **₹508**
  - Compare: Blue Dart ₹900+ ✅

### 4. Package Constraints

**Weight**: 
- Maximum 15kg (system limit)
- Travelers self-select capacity (soft guideline, not enforced)
- Travelers can accept multiple packages until capacity reached

**Dimensions**:
- Travelers specify max dimensions they can carry
- Common: 30×30×30, 40×40×40, 50×50×50 cm
- Larger dimensions = higher surcharge

**Value Declaration**:
- Sender must declare package value (₹500 - ₹10,000)
- Higher value = higher pricing tier
- Traveler liable for declared value if lost

**Prohibited Items**:
- Jewelry, precious metals, cash
- Electronics >₹15,000
- Passports, legal documents  
- Perishable food, liquids >100ml
- Weapons, drugs, hazardous materials

### 5. Package Categories
Sender selects category for trust/safety:
- 📄 Documents
- 👕 Clothes
- 📚 Books
- 📱 Electronics (small)
- 🍫 Food (packaged, non-perishable)
- 🎁 Gifts
- 📦 Other (requires description)

### 6. Zone-Based Delivery

Traveler specifies their final destination area. Delivery pricing adjusts by distance:

```
Traveler destination: Delhi - Saket

Delivery zones from Saket:
- 0-3km radius: Base price (included)
- 3-10km: +₹30
- 10-20km: +₹80
- >20km: +₹150 (or traveler can decline)
```

Sender sees zone pricing when browsing travelers.

### 7. Time Windows

**Traveler-Driven Schedule**:
- Traveler posts trip with pickup window (e.g., "July 17, 10am-1pm")
- Traveler posts delivery window (e.g., "July 17, 6pm-9pm")
- Senders filter by compatible timing
- 24 hours before: Both parties confirm exact time via chat

### 8. Bidirectional Marketplace

**Senders can**:
1. Post package → wait for travelers to request
2. Browse travelers → send request to specific traveler

**Travelers can**:
1. Post trip → wait for package requests
2. Browse packages → send request to specific package

**Instant Notifications**:
- New traveler matches your route → Sender notified
- New package matches your trip → Traveler notified
- Creates maximum matching liquidity

### 9. Request & Negotiation Flow

```
Sender finds Traveler
↓
Sender sends request: "Please carry my package for ₹250"
↓
Traveler sees request with all details
↓
Traveler options:
  [Accept ₹250] [Decline] [Counter: ₹300]
↓
If counter-offer: Sender can accept or decline
↓
Once both agree → Match confirmed → Payment triggered
```

No auto-accept. Both parties must explicitly agree.

### 10. Payment & Escrow (Pay at Match)

```
Match confirmed
↓
Sender pays immediately via UPI/Card/Wallet
↓
Money held in Quiko escrow
↓
Pickup happens (1-7 days later)
↓
Delivery completed + OTP verified
↓
Traveler receives 98% of amount
Quiko keeps 2% commission
```

**Refund Policy**:
- Sender cancels >24hrs before pickup: 100% refund
- Sender cancels <24hrs: 50% refund (50% penalty)
- Traveler cancels >24hrs: 100% refund to sender
- Traveler cancels <24hrs: 100% refund + traveler penalty (₹100)
- Failed delivery due to dispute: Case-by-case review

### 11. No-Show & Liability Policies

**Sender No-Show at Pickup**:
- Traveler waits entire pickup window
- Clicks "Sender no-show" at end of window
- 30min grace period for sender to respond
- If no response:
  - Traveler gets ₹100 compensation (from escrowed ₹250)
  - Sender gets ₹150 refund
  - Sender trust score drops
  - After 2 no-shows: Account suspended

**Traveler No-Show at Pickup**:
- Sender waits entire window, clicks "Traveler no-show"
- 30min grace period
- If no response:
  - Sender gets 100% refund
  - Traveler charged ₹100 penalty
  - Traveler trust score destroyed
  - After 1 no-show: Account suspended

**Traveler No-Show at Delivery** (Most Critical):
- 30min past delivery window, receiver clicks "No-show"
- System tries to contact traveler (push, SMS, call)
- If no response in 2 hours:
  - Treated as LOST PACKAGE
  - Sender refunded (traveler liable for declared value)
  - Traveler account permanently banned
  - Police report option available

**Lost/Damaged Package**:
- Traveler accepts liability at pickup
- If package lost/damaged in transit:
  - Traveler must compensate sender for declared value
  - Deducted from traveler's future earnings or payment method
  - Permanent rating damage
- Incentivizes travelers to be careful and honest

### 12. Trust & Safety

**Tiered Verification System**:

```
Level 1 (Browse Only):
- Phone number (OTP verified)
- Email verified
- Can browse listings only

Level 2 (Basic Transact):
- + Aadhaar verified (DigiLocker API)
- Can create postings and transact
- Transaction limit: ₹5,000/month
- "Verified" badge

Level 3 (Full Access):
- + PAN card
- + Address proof
- + Profile photo
- Unlimited transactions
- "Verified Pro" badge
- Ranked higher in searches

Level 4 (Premium):
- + Background check
- "Premium Verified" badge
- Preferred in matching algorithm
- Higher trust from users
```

**Package Verification at Pickup**:
1. Sender shows package to traveler
2. Both verify weight, dimensions match posting
3. Traveler uploads photo of package
4. Traveler accepts terms: "I verify package contents are as described"
5. New users (0-5 deliveries): Mandatory video call with Quiko support
6. Trusted users (10+ successful): Skip video verification

**Prohibited Items Checklist**:
- Displayed during package creation
- Sender must confirm: "Package does NOT contain prohibited items"
- Traveler can report mismatch at pickup (triggers support investigation)

### 13. Enhanced Chat Features

**Text & Media**:
- Text messaging
- Photo upload/sharing
- Location pin sharing (one-time)

**Live Features**:
- Live location sharing (30-minute button for meetup coordination)
- Phone call button (uses system dialer, no in-app calling)

**Quick Replies** (Preset buttons):
- "I'm here"
- "Running 10 mins late"
- "Can't find you, please share location"
- "Package ready for pickup"

**Support Integration**:
- "Report Issue" button → Escalates to Quiko support
- Screenshot of chat sent to support team
- Support can join conversation if needed

### 14. Rating System

**Multi-Criteria Rating (Sender → Traveler)**:
```
After delivery, sender rates traveler on:
- Communication: ⭐⭐⭐⭐⭐
- Timeliness: ⭐⭐⭐⭐⭐
- Package care: ⭐⭐⭐⭐⭐
- Professionalism: ⭐⭐⭐⭐⭐

Overall: Auto-calculated average
Optional comment: [text field]
```

**Multi-Criteria Rating (Traveler → Sender)**:
```
Traveler rates sender on:
- Communication: ⭐⭐⭐⭐⭐
- On-time at pickup: ⭐⭐⭐⭐⭐
- Package as described: ⭐⭐⭐⭐⭐
- Politeness: ⭐⭐⭐⭐⭐
```

**Receiver Ratings (Receiver → Traveler)**:
```
Receiver rates delivery experience:
- On time: ⭐⭐⭐⭐⭐
- Package condition: ⭐⭐⭐⭐⭐
- Courtesy: ⭐⭐⭐⭐⭐

Counts toward traveler's overall score
```

**Trust Score Calculation**:
```
Trust Score = (Average Rating × Total Deliveries) + Verification Level Bonus

Example:
- 4.8★ average × 25 deliveries = 120 points
- Level 3 verification = +30 points
- Total Trust Score: 150

Higher trust score = Better ranking in searches
```

### 15. Search & Filters

**Sender Searching for Travelers**:
```
Basic Filters (Always visible):
- Route: From/To cities
- Date: Travel date
- Search button

Advanced Filters (Expandable):
- Traveler rating: ≥4.5★
- Capacity available: ≥3kg
- Price range: ₹200-500
- Verification level: Level 2+ only
- Transport mode: Flight/Train/Bus
```

**Traveler Searching for Packages**:
```
Basic Filters:
- Route matching my trip
- Date matching
- Weight ≤ my capacity

Advanced Filters:
- Package category: Documents/Electronics/Clothes/etc.
- Weight range: 1-5kg
- Price offered: ≥₹300
- Sender rating: ≥4★
- Package value: Up to ₹5,000 (to limit liability)
- Pickup distance: Within 5km of departure point
```

---

## User Flows

### Complete Sender Journey

```
1. Login → Home → "Send a Package"
2. Create Package Posting:
   - From: Chennai (location picker)
   - To: Mumbai (location picker)
   - Travel date: July 17
   - Weight: 3kg
   - Dimensions: 30×30×30
   - Declared value: ₹2,000
   - Category: Clothes
   - Upload photo of package
   - Description: "Winter jackets for family"
   
3. System calculates Max Price: ₹83
   - Sender sets offer: ₹70 (slider up to ₹83)
   
4. Posting created → "Looking for travelers..."

5. Browse Travelers (optional):
   - See list ranked by trust score
   - Filter by rating, transport mode
   - Send request to specific traveler
   
6. Receive Traveler Requests:
   - "Raj wants to carry your package for ₹70"
   - View Raj's profile: 4.8★, 35 deliveries, Flight
   - [Accept] [Decline] [Counter-offer]
   
7. Accept Match → Payment Screen:
   - Amount: ₹70
   - Breakdown: Traveler gets ₹68.60, Quiko ₹1.40
   - Pay via: UPI/Card/Wallet
   - Confirm payment
   
8. Payment Success → Match Confirmed:
   - "Matched with Raj!"
   - Pickup window: July 17, 11am-1pm
   - [Chat with Raj] button
   
9. Chat Coordination:
   - "Hi Ananya, I'll be at T Nagar junction at 11:30am"
   - Share location pin
   - "Sounds good, see you then!"
   
10. Day of Pickup:
    - 24hrs before: Confirm exact time in chat
    - At pickup location (11:30am)
    - Raj verifies package (weight, dimensions)
    - Raj uploads photo
    - Both accept terms
    - "Pickup confirmed!"
    
11. Tracking:
    - See Raj's journey status
    - "Raj picked up package"
    - "Raj in transit" (optional location sharing)
    - "Raj arrived at Mumbai"
    
12. Delivery Notification:
    - "Package delivered to receiver!"
    - Receiver confirmed with OTP
    
13. Rate Raj:
    - Communication: 5★
    - Timeliness: 5★
    - Package care: 5★
    - Professionalism: 5★
    - Comment: "Excellent service, very professional!"
    - Submit rating
    
14. Done! → Back to Home
```

### Complete Traveler Journey

```
1. Login → Home → "Carry Packages"
2. Create Trip Posting:
   - From: Chennai - T Nagar area
   - To: Mumbai - Andheri area
   - Travel date: July 17
   - Departure time: 2:00 PM
   - Pickup window: 10am-1pm (before departure)
   - Delivery window: 6pm-9pm (after arrival)
   - Transport mode: Flight
   - Capacity: ~10kg (soft guideline)
   - Max dimensions: 40×40×40
   - Delivery radius: Within 10km of Andheri
   
3. Posting created → "Looking for packages..."

4. Browse Packages (optional):
   - See ranked list of packages on my route
   - Filter by weight, value, category
   - Current capacity used: 0kg / 10kg
   - Send request to carry specific package
   
5. Receive Package Requests:
   - "Ananya wants you to carry 3kg package for ₹70"
   - View package details: Clothes, 3kg, ₹2000 value
   - View Ananya's profile: 4.5★, 10 packages sent
   - [Accept] [Decline] [Counter: ₹90]
   
6. Accept Match → Match Confirmed:
   - "Matched with Ananya!"
   - You'll earn: ₹68.60 (₹70 - 2% commission)
   - Pickup: July 17, 11am-1pm at T Nagar
   - [Chat with Ananya]
   - Current capacity: 3kg / 10kg used
   
7. Accept More Packages (optional):
   - Browse more packages on same route
   - Accept another 2kg package
   - Capacity now: 5kg / 10kg
   
8. Day of Pickup:
   - Chat with Ananya: Confirm 11:30am meetup
   - Navigate to pickup location
   - Meet Ananya
   
9. Package Verification:
   - Weigh package: 3kg ✓
   - Measure dimensions: 30×30×30 ✓
   - Open package to verify contents (clothes)
   - Upload photo of package
   - Accept terms: "I verify package is as described"
   - "Pickup confirmed!"
   
10. Journey:
    - Board flight at 2pm
    - Package in cabin luggage
    - Land in Mumbai at 4:30pm
    
11. Delivery Coordination:
    - Get receiver details in app
    - Chat with receiver: "I've landed, can meet at 7pm?"
    - Share delivery location
    
12. Meet Receiver:
    - Navigate to meeting point
    - Receiver verifies identity
    - Hand over package
    - Receiver enters OTP: 4 8 2 9
    - "Delivery confirmed!"
    
13. Payment Released:
    - "You've earned ₹68.60!"
    - Added to Quiko wallet
    - [Withdraw to Bank] option
    
14. Rate Ananya:
    - Communication: 5★
    - On-time: 5★
    - Package as described: 5★
    - Politeness: 5★
    - Submit rating
    
15. Done! → Back to Home
```

---

## MVP Scope (Phase 1)

**INCLUDED**:
✅ Phone/Email login (OTP)
✅ Single profile per account (simplify: user is EITHER sender OR traveler, not both)
✅ Create posting (sender OR traveler)
✅ Browse listings (basic search, no advanced filters)
✅ Send request + Accept/Decline (no counter-offer negotiation)
✅ Payment escrow via UPI/Card
✅ Basic chat (text + photo)
✅ Pickup confirmation with photo
✅ Delivery OTP verification
✅ Simple 5-star rating (not multi-criteria)

**EXCLUDED (Phase 2)**:
❌ Dual sender/traveler profiles
❌ Advanced search filters
❌ Counter-offer negotiation
❌ Multi-criteria ratings
❌ Receiver ratings
❌ Live location tracking
❌ Automated no-show handling (manual support initially)
❌ Tiered KYC levels (Level 2+ verification)

---

## Technical Requirements

### Platforms
- **iOS app** (React Native or Swift)
- **Android app** (React Native or Kotlin)
- **Backend API** (Node.js/Python)
- **Database** (PostgreSQL/MongoDB)
- **Payment Gateway** (Razorpay/Stripe)
- **SMS/OTP** (Twilio/AWS SNS)
- **Cloud Storage** (AWS S3 for photos)
- **Maps** (Google Maps API)

### Key Integrations
- **Aadhaar Verification**: DigiLocker API
- **Payment**: Razorpay for UPI/Cards/Wallets
- **Geolocation**: Google Maps API for route calculation
- **Notifications**: Firebase Cloud Messaging
- **SMS**: For OTP and critical updates

---

## Success Metrics (KPIs)

**User Acquisition**:
- Monthly active users (MAU)
- Sender-to-Traveler ratio (target: 1:1.7 based on market data)
- New registrations per week

**Engagement**:
- Match success rate (listings → confirmed matches)
- Average time to match
- Repeat sender rate
- Repeat traveler rate

**Transaction**:
- Total packages delivered per month
- Average transaction value
- Commission revenue (2% of GMV)
- Payment success rate

**Trust & Quality**:
- Average rating (target: >4.5★)
- No-show rate (target: <3%)
- Lost/damaged package rate (target: <1%)
- Customer support tickets per 100 deliveries

**Unit Economics**:
- Customer acquisition cost (CAC)
- Lifetime value (LTV)
- Take rate: 2%
- Target: ₹2.25L - ₹3.75L daily revenue across all routes

---

## Competitive Advantages

1. **50-80% cost savings** vs traditional couriers
2. **Faster delivery** via direct routes (especially flights)
3. **Sustainability** story resonates with eco-conscious users
4. **Income opportunity** for millions of travelers
5. **Transparent pricing** with clear calculation
6. **Trust system** with verified users and ratings
7. **Flexible capacity** - travelers self-select what they can carry

---

## Risks & Mitigation

**Risk 1: Trust/Safety Issues**
- Mitigation: Multi-level verification, package photo verification, liability policies, insurance options (Phase 2)

**Risk 2: Low Liquidity (Not enough matches)**
- Mitigation: Aggressive notifications, incentivize early users, geographic focus (start with Chennai-Mumbai-Delhi golden triangle)

**Risk 3: Payment Fraud**
- Mitigation: KYC verification, escrow system, dispute resolution process

**Risk 4: Regulatory Issues**
- Mitigation: Legal compliance, courier license if needed, insurance partnerships

**Risk 5: Traveler Liability Concerns**
- Mitigation: Clear value caps (₹10k max), prohibited items list, optional insurance for high-value packages (Phase 2)

---

## Go-to-Market Strategy

### Phase 1: Chennai-Mumbai-Delhi Triangle (6 months)
- Focus on these 3 metros (highest flight/train frequency)
- Target student communities (senders)
- Target business travelers (frequent flyers)
- University partnerships for student senders

### Phase 2: Tier 1 Cities (6-12 months)
- Add: Bangalore, Hyderabad, Kolkata
- Expand to 30+ city pair combinations
- Introduce value-added features (insurance, multi-stop)

### Phase 3: Tier 2 Cities (12-18 months)
- Regional routes (Pune, Ahmedabad, Jaipur, etc.)
- Train travelers (more than flights)

### Phase 4: Scale (18+ months)
- Pan-India coverage
- International routes (Dubai, Singapore, Bangkok)

---

## Brand Identity

**Colors**:
- Primary: Yellow (#FFD93D) - Energy, speed, optimism
- Secondary: Black (#1A1A1A) - Trust, premium, professional
- Accent: White - Clean, simple

**Voice & Tone**:
- Friendly but professional
- Fast-paced, energetic
- Trustworthy, transparent
- Sustainability-conscious

**Visual Style**:
- Bold, high-contrast
- Clean, minimal UI
- Icon-driven navigation
- Mobile-first design

---

*This document reflects the complete product vision for Quiko MVP. All decisions documented here are based on extensive user research and competitive analysis.*
