# Quiko Design Decisions - Grilling Session

**Date**: July 10, 2026  
**Participants**: Product Owner, Claude (Design Advisor)  
**Purpose**: Deep-dive questioning to solidify product decisions before building prototype

---

## Session Overview

This document captures the comprehensive grilling session where we systematically questioned every aspect of the Quiko business model. Each question explores the "why" behind our decisions, alternative options considered, and the rationale for our final choices.

**Goal**: Ensure we've thought through edge cases, user flows, trust/safety, and business viability before writing a single line of code.

---

## Q1: Maximum Package Weight - What's the ceiling?

**Context**: Travelers are regular people, not professional couriers. They have limited capacity.

**Options Considered**:
- 3kg (very restrictive)
- 5kg (airline cabin baggage typical)
- 10kg (airline check-in limit)
- 15kg (our choice)
- 20kg+ (too heavy for casual travelers)

**Decision**: **15kg system maximum**

**Rationale**:
- Most packages will be <5kg (documents, clothes, books)
- 15kg accommodates larger items without being unrealistic
- Travelers self-select their capacity (not enforced)
- Flexibility for travelers to choose 3kg, 7kg, 12kg based on their trip
- Competitive with couriers (who charge exponentially more above 10kg)

**Key Insight**: Don't hard-limit travelers. Let them manage their own capacity intelligently. System sets max at 15kg for safety/liability reasons.

---

## Q2: Package Dimensions - How big is too big?

**Context**: Weight isn't everything. A 2kg pillow (50×50×50) takes more space than a 5kg book stack (20×20×10).

**Options Considered**:
- Fixed: 30×30×30 only
- Fixed: 40×40×40 only
- **Traveler-specified** (our choice)

**Decision**: **Travelers specify max dimensions they can handle**

**Rationale**:
- Flight travelers: Limited to cabin size (40×40×40 typical)
- Train travelers: More flexible (can do 50×50×50+)
- Bus travelers: Most flexible
- Volume surcharges incentivize honest declaration
- Travelers know their own space constraints

**Volume Surcharge Pricing**:
- ≤30×30×30: ₹0
- ≤40×40×40: +₹20
- ≤50×50×50: +₹50

---

## Q3: Pricing Formula - Math That's Fair to Both Sides

**Context**: Need a formula that's fair for senders (affordable), fair for travelers (compensates effort), and competitive with market.

**Options Explored**:

### Option A: Additive (Industry Standard)
```
Price = Base + (Weight × Rate) + (Distance × Rate) + Time Multiplier
Price = ₹50 + (5kg × ₹20) + (1360km × ₹0.15) + 1.5x
     = ₹50 + ₹100 + ₹204 = ₹354 × 1.5 = ₹531
```
❌ Weight and distance treated independently (but effort = weight × distance)

### Option B: Multiplicative
```
Price = (Weight × Distance × Time) × Constant
Price = (5kg × 1360km × 1.5) × ₹0.05 = ₹510
```
❌ Exponential growth: 2×2 = 4× price (unfair scaling)

### Option C: Hybrid (Our Choice) ✅
```
Max Price = Base + (Weight × Distance × Rate) × Time_Multiplier + Volume + Value_Tier

Price = ₹30 + (5 × 1360 × ₹0.03) × 1.3 + ₹20 + ₹30
     = ₹30 + ₹204 × 1.3 + ₹50 = ₹345
```

**Decision**: **Hybrid Formula**

**Rationale**:
- Combines both effort factors (weight × distance) = realistic effort metric
- Linear scaling (2× weight + 2× distance = ~4× price, which is fair)
- Competitive: ₹83 for 1kg Chennai-Mumbai vs DTDC ₹400, Blue Dart ₹750
- Transparent: Users understand "heavier + farther = more expensive"

**Formula Breakdown**:
```
Max Price = ₹30 (base)
          + (Weight_kg × Distance_km × ₹0.03) × Time_Multiplier
          + Volume_Surcharge
          + Value_Tier_Surcharge

Time Multipliers:
- Same day: 1.8x (urgent, premium)
- Next day: 1.3x (standard)
- Flexible: 1.0x (economy)

Value Tiers (Risk compensation):
- Up to ₹2,000: Base
- ₹2,001-₹5,000: +₹30
- ₹5,001-₹10,000: +₹80
```

**Real Examples**:
1. **Student use case**: 1kg, Chennai→Bangalore (350km), next day
   - = ₹30 + (1×350×0.03)×1.3 = ₹44 (vs DTDC ₹250+) ✅

2. **Your PDF example**: 1kg, Chennai→Mumbai (1360km), next day
   - = ₹30 + (1×1360×0.03)×1.3 = ₹83 (vs DTDC ₹400, Blue Dart ₹750) ✅

3. **Heavy package**: 10kg, Delhi→Mumbai (1400km), same-day, 40×40×40, ₹8k value
   - = ₹30 + (10×1400×0.03)×1.8 + ₹20 + ₹80 = ₹886 (vs Blue Dart ₹1200+) ✅

---

## Q4: Traveler Capacity - Hard Limit or Soft Guideline?

**Context**: Traveler says "I can carry 10kg" but accepts packages totaling 12kg. Problem?

**Options**:
- **Hard limit**: System blocks after 10kg (rigid)
- **Soft guideline with warning**: Our choice (flexible)

**Decision**: **Soft guideline**

**Rationale**:
- Traveler knows their situation better than system
- They might post trip 7 days before departure, adjust plans
- Warning shows: "⚠️ You've accepted 12kg (exceeds your 10kg guideline)"
- Traveler can increase capacity in profile or decline new requests
- Trust adults to manage their own commitments

**Key Quote from Decision**:
> "Raj knows what he's accepting. He posted his trip a week ago. Over 7 days he accepts packages one by one. Maybe his original plan changed. No need for system to enforce artificial limits."

---

## Q5: Multiple Packages - Can Travelers Carry More Than One?

**Context**: Raj has 10kg capacity. Can he carry 3kg + 2kg + 4kg = three packages?

**Options**:
- Single package only (simple)
- **Multiple packages** (our choice)
- Batch commitment (shopping cart model)

**Decision**: **Multiple packages, accepted one-by-one**

**Rationale**:
- Maximize earning potential for travelers
- Better capacity utilization (3×3kg vs 1×9kg)
- Traveler can stop accepting when comfortable
- Each acceptance is independent commitment
- Coordinates pickup/delivery for each

**Flow**:
```
Day 1: Raj posts trip, 10kg capacity
Day 2: Accepts 3kg package from Ananya (7kg remaining)
Day 4: Accepts 2kg package from Priya (5kg remaining)
Day 6: Accepts 5kg package from Vikram (0kg remaining)
Day 7: Travel day - 3 separate pickups, 3 deliveries
```

**Complexity Trade-off**: More coordination needed, but significantly higher earnings (₹200+₹150+₹300 = ₹650 vs single ₹400 package).

---

## Q6: Notifications - Push Every Match or Filter?

**Context**: 50 travelers on Chennai-Mumbai route. Does each sender get 50 notifications?

**Options**:
- Instant notification for every match (noisy)
- Daily digest (slower matching)
- Filtered notifications (complex logic)

**Decision**: **Instant notifications for ALL matches**

**Rationale**:
- Early-stage platform needs maximum liquidity
- Fast matching = better user experience
- Users can disable in settings if overwhelmed
- Trade-off: Noise vs Speed → We chose Speed
- Can add smart filtering in Phase 2 based on user preferences

**Notification Strategy**:
- New traveler on your route → Sender notified
- New package on your route → Traveler notified
- Someone requests your posting → Both parties notified
- Match confirmed → Both notified
- Critical updates (no-shows, delivery) → SMS + Push

---

## Q7: Search & Filters - Basic or Advanced from Day 1?

**Context**: Should users filter by rating, price, transport mode, etc.?

**Options**:
- Basic only: Route + Date
- **Advanced filters** (our choice)

**Decision**: **Full advanced filters from MVP**

**Rationale**:
- Users need control to find right matches
- Sender searching travelers:
  - Filter by rating (≥4.5★)
  - Filter by transport mode (prefer flights for speed)
  - Filter by verification level (trust)
  - Filter by price range
- Traveler searching packages:
  - Filter by weight (≤ my capacity)
  - Filter by category (avoid risky items)
  - Filter by value (limit liability)
  - Filter by pickup distance

**Key Insight**: "More filters = better matches = higher success rate = better retention"

---

## Q8: Matching System - Who Gets Priority?

**Context**: 10 travelers on same route. How does sender choose?

**Options**:
- First-come first-served (fast but random quality)
- **Ranked open marketplace** (our choice)
- Auto-match by algorithm (removes sender control)
- Auction/bidding (race to bottom pricing)

**Decision**: **Ranked Open Marketplace**

**Ranking Algorithm**:
```
Sort travelers by:
1. Trust Score (Rating × Delivery Count)
   Example: 4.8★ × 25 deliveries = 120 points
2. Verification Level
   Level 3 = +30 points
3. Transport Mode (for speed)
   Flight = +10, Train = +5, Bus = 0
4. Pickup Distance
   <2km = +10, <5km = +5, >5km = 0

Total Score: Used to rank display
```

**Key Features**:
- All travelers can send requests (no artificial gatekeeping)
- Sender sees ranked list with all details
- Sender has full control to choose
- New travelers can still get chosen (if good profile, close location)
- Competition on quality, not just speed

---

## Q9: Payment Timing - When Does Money Move?

**Context**: Critical trust decision. When does sender pay? When does traveler get paid?

**Options Explored**:
- Pay at match (sender commits early)
- Pay at pickup (sender pays only when package collected)
- Pay at delivery (sender pays after successful delivery)

**Initial Choice**: Pay at Pickup (Option B)

**Why we changed**: Payment failure edge case
- Traveler shows up for pickup
- Sender's payment fails (card declined, insufficient balance)
- Traveler wasted time → Bad experience
- Erodes trust in platform

**Final Decision**: **Pay at Match (with Escrow)**

**Rationale**:
- Serious commitment from sender (reduces no-shows)
- Traveler guaranteed payment (safe to show up)
- Industry standard (Uber, Airbnb, Swiggy all pre-charge)
- Escrow protects both parties
- Refund policy handles cancellations fairly

**Escrow Flow**:
```
Match confirmed → Sender pays → Quiko holds in escrow
→ Pickup happens → Delivery happens → OTP verified
→ Traveler gets 98% → Quiko keeps 2%
```

**Refund Policy**:
- Sender cancels >24hrs: 100% refund (no penalty)
- Sender cancels <24hrs: 50% refund (50% penalty for short notice)
- Traveler cancels >24hrs: 100% refund to sender
- Traveler cancels <24hrs: 100% refund + traveler penalized ₹100

---

## Q10: Liability - Who Pays If Package Lost?

**Context**: Package lost/stolen during transit. Who bears the cost?

**Options**:
- Traveler liable (high risk for travelers)
- Sender takes risk (no trust in platform)
- Quiko insurance pool (Quiko absorbs loss)
- **Optional insurance** (our choice)

**Decision**: **Traveler Liable + Value Caps**

**Rationale**:
- Creates maximum accountability
- Traveler accepts liability at pickup (informed consent)
- **But protected with caps**:
  - Declared value required (₹500 - ₹10,000)
  - Value tiers affect pricing (higher value = higher pay)
  - Prohibited items (jewelry, cash, electronics >₹15k)
  - Traveler can filter packages by value

**Risk Management**:
- Traveler sees value before accepting
- Can filter "only show packages <₹3,000"
- Higher value = higher compensation (₹2k package base, ₹8k package +₹80)
- Traveler incentivized to be careful with high-value items

**Example**:
- Ananya posts: 3kg package, declared value ₹2,000 (clothes)
- Raj loses it
- Raj must compensate ₹2,000 (deducted from future earnings or payment method)
- If Ananya lied (actually ₹10k jewelry): Ananya forfeits compensation (prohibited item)

**Phase 2 Addition**: Optional insurance
- Sender can buy insurance (2% of declared value)
- If lost: Sender compensated from insurance pool
- Reduces traveler liability

---

## Q11: Delivery Location - Fixed Address or Flexible?

**Context**: Traveler lands at Mumbai airport. Receiver is 25km away in suburbs. Must traveler go there?

**Options**:
- Fixed address delivery (burden on traveler)
- Flexible meetup (burden on receiver)
- **Zone-based with pricing** (our choice)

**Decision**: **Zone-based Delivery with Distance Pricing**

**How It Works**:
```
Traveler specifies final destination area: "Mumbai - Andheri"

Delivery pricing from Andheri:
- 0-3km: Base price (included)
- 3-10km: +₹30
- 10-20km: +₹80
- >20km: +₹150 (or traveler can decline)

Sender sees pricing, chooses delivery zone accordingly
```

**Rationale**:
- Fair compensation for traveler's extra distance
- Transparent to sender (knows cost upfront)
- Receiver convenience balanced with traveler effort
- Traveler can set "only within 5km" if desired

**Example**:
- Raj: Flying to Mumbai, final destination Andheri
- Package A: Delivery to Bandra (5km from Andheri) → +₹30
- Package B: Delivery to Colaba (20km from Andheri) → +₹80
- Raj can accept both, decline both, or choose one

---

## Q12: Pickup/Delivery Timing - Who Sets the Schedule?

**Context**: 3 people's schedules must align (sender, traveler, receiver). How?

**Options**:
- Fixed time slots (rigid)
- Free negotiation in chat (too much back-and-forth)
- **Traveler-driven windows** (our choice)

**Decision**: **Traveler Sets Time Windows**

**Rationale**:
- Traveler's schedule is FIXED (flight/train departure time)
- Sender/receiver must adapt to traveler
- Reduces negotiation friction
- Clear expectations upfront

**How It Works**:
```
Traveler posts trip:
- Pickup window: July 17, 10am-1pm (before 2pm flight)
- Delivery window: July 17, 6pm-9pm (after 4:30pm landing + baggage)

Senders filter: "Show only travelers with morning pickup"

24 hours before:
- Both parties confirm exact time via chat
- Default: Start of window if no confirmation
```

**Example**:
- Raj's flight departs 2pm
- He sets pickup: 10am-1pm (safe buffer)
- Ananya sees this, decides if it works for her
- Day before: Chat confirms 11:30am pickup
- Backup: If no confirmation, default to 10am

---

## Q13: Negotiation - Auto-Match or Back-and-Forth?

**Context**: Sender offers ₹200. Traveler wants ₹250. What happens?

**Options**:
- Auto-accept (no negotiation)
- **Negotiation phase** (our choice)

**Decision**: **Request → Counter-offer → Accept Flow**

**Rationale**:
- Market-driven pricing
- Both parties feel in control
- Prevents commitment regret
- Transparent process

**Flow**:
```
Ananya (sender) offers ₹200 for 3kg package

Raj (traveler) sees request:
→ [Accept ₹200] [Decline] [Counter-offer]

Raj clicks Counter-offer: ₹250

Ananya sees counter:
→ [Accept ₹250] [Decline] [Counter: ₹225]

Back-and-forth until agreement or timeout (24hrs)

Once accepted → Match confirmed → Payment
```

**Safeguards**:
- Max 3 counter-offers (prevents endless haggling)
- 24hr expiration (creates urgency)
- Either party can walk away

---

## Q14: Chat Features - What's Essential vs Nice-to-Have?

**Context**: Users need to coordinate pickup/delivery. What tools do they need?

**MVP Features (Option B - Enhanced Chat)**:
✅ Text messaging
✅ Photo upload/sharing
✅ Location pin sharing (one-time)
✅ Live location sharing (30-min button for meetup)
✅ Quick reply buttons: "I'm here", "10 mins late", "Can't find you"
✅ Phone call button (uses system dialer)
✅ "Report Issue" → Escalates to support

**Excluded from MVP**:
❌ In-app voice/video calling (expensive to build, use system dialer instead)
❌ Continuous live tracking (battery drain, privacy concerns)
❌ Message reactions/emojis (nice-to-have)

**Rationale**:
- Quick replies reduce friction (tap instead of type)
- Live location only when needed (30-min window)
- System phone call is simpler than in-app calling
- Report Issue button critical for dispute resolution

---

## Q15: No-Shows - Policies That Protect Both Sides

**Context**: No-shows will happen. Need clear, fair consequences.

### Scenario A: Sender No-Show at Pickup

**Policy**:
- Traveler waits entire pickup window (e.g., 11am-1pm)
- At end of window, clicks "Sender no-show"
- 30-minute grace period for sender to respond
- If no response:
  - Traveler gets ₹100 compensation (from escrowed ₹250)
  - Sender gets ₹150 refund
  - Sender trust score drops significantly
  - After 2 no-shows: Account suspended

**Rationale**:
- Traveler compensated for wasted time
- Sender penalized but not destroyed
- Trust score impact prevents repeat offenders

### Scenario B: Traveler No-Show at Pickup

**Policy**:
- Sender waits entire window, clicks "Traveler no-show"
- 30-minute grace period
- If no response:
  - Sender gets 100% refund (₹250)
  - Traveler charged ₹100 penalty
  - Traveler trust score destroyed
  - After 1 no-show: Account suspended

**Rationale**:
- Stricter on travelers (service providers)
- Sender fully protected (100% refund)
- High penalty because sender might have time-sensitive need

### Scenario C: Traveler No-Show at Delivery (CRITICAL)

**Policy**:
- 30 minutes past delivery window, receiver clicks "No-show"
- System tries to contact traveler (push, SMS, call)
- If no response in 2 hours:
  - **Treated as LOST PACKAGE**
  - Sender refunded (traveler liable for declared value)
  - Traveler account **permanently banned**
  - Police report option available
  - Traveler cannot use platform until package delivered or value paid

**Rationale**:
- Most serious offense (package already in transit)
- Could be theft/fraud
- Zero tolerance to protect platform reputation
- Permanent ban prevents bad actors

---

## Q16: KYC Verification - How Much is Enough?

**Context**: Need trust but also fast onboarding. Where's the balance?

**Decision**: **Tiered Verification (Option D)**

**Tiers**:
```
Level 1 (Browse Only):
- Phone + Email verified
- Can explore, cannot transact

Level 2 (Basic Transact):
- + Aadhaar verified (DigiLocker API)
- Can create postings, match, transact
- Limit: ₹5,000/month
- "Verified" badge

Level 3 (Full Access):
- + PAN card + Address proof + Photo
- Unlimited transactions
- "Verified Pro" badge
- Ranked higher in searches

Level 4 (Premium):
- + Background check
- "Premium Verified" badge
- Preferred matching
```

**Rationale**:
- Progressive disclosure: User chooses friction level
- Level 1: No friction exploration (builds interest)
- Level 2: Minimum viable trust (Aadhaar = legal compliance)
- Level 3: Serious users verify for benefits (better matches)
- Level 4: Premium users signal high trust

**MVP Launch**: Require minimum Level 2 for any transaction

---

## Q17: User Roles - One Profile or Two?

**Context**: Can Ananya be both sender (today) and traveler (next week)?

**Options**:
- Single unified profile (simple, mixed ratings)
- **Separate profiles under one account** (our choice)

**Decision**: **Dual Profiles, One Account**

**Structure**:
```
One Login (Phone + Email)
↓
Two Profiles:
├─ Sender Profile (Rating: 4.8★, History: 20 packages sent)
└─ Traveler Profile (Rating: 4.2★, History: 5 deliveries)

Shared: KYC, Payment Methods, Wallet
```

**Rationale**:
- Someone can be great sender but new traveler
- Ratings should reflect role-specific behavior
- Transparency: Other users see relevant experience
- Shared KYC saves time (verify once, use twice)

**UI Flow**:
```
Login → Home:
[Send a Package] [Carry Packages]
      ↓                  ↓
 Sender Profile    Traveler Profile
```

---

## Q18: Rating System - Single Star or Multi-Criteria?

**Context**: After delivery, both parties rate. How detailed should it be?

**Decision**: **Multi-Criteria Rating for Service Providers**

**Sender → Traveler** (Service provider gets detailed feedback):
```
Rate Raj on:
- Communication: ⭐⭐⭐⭐⭐
- Timeliness: ⭐⭐⭐⭐⭐
- Package care: ⭐⭐⭐⭐⭐
- Professionalism: ⭐⭐⭐⭐⭐

Overall: 4.8★ (auto-calculated)
Comment: [optional]
```

**Traveler → Sender** (Customer gets simpler rating):
```
Rate Ananya on:
- Communication: ⭐⭐⭐⭐⭐
- On-time at pickup: ⭐⭐⭐⭐⭐
- Package as described: ⭐⭐⭐⭐⭐
- Politeness: ⭐⭐⭐⭐⭐
```

**Receiver → Traveler** (3rd perspective adds accountability):
```
Rate delivery:
- On time: ⭐⭐⭐⭐⭐
- Package condition: ⭐⭐⭐⭐⭐
- Courtesy: ⭐⭐⭐⭐⭐
```

**Rationale**:
- Travelers are service providers → deserve detailed feedback
- Multi-criteria helps them improve specific areas
- Receiver ratings catch issues sender might miss
- Prevents gaming (can't fake all dimensions)

---

## Q19: Transport Mode - Does It Affect Anything?

**Context**: Flights are fastest, buses slowest. Should this matter?

**Decision**: **No transport mode multiplier in pricing**

**Rationale**:
- Market will self-adjust (flight travelers can demand higher prices in negotiation)
- Avoids complex pricing rules
- Users understand intuitively (flight = faster = worth more)
- Keep formula simple

**However**: Transport mode IS used in ranking
- When displaying travelers, flight travelers ranked higher (speed preference)
- But doesn't force pricing differences

---

## Q20: MVP Scope - What Can Wait?

**Context**: We've designed a comprehensive system. What's Phase 1 vs Phase 2?

**Phase 1 MVP** (Launch in 3 months):
✅ Phone/Email login
✅ Single profile (user is sender OR traveler, not both)
✅ Create posting (sender/traveler)
✅ Browse with basic filters
✅ Request → Accept/Decline (no counter-offer yet)
✅ Payment escrow
✅ Basic chat (text + photo)
✅ Pickup confirmation
✅ Delivery OTP
✅ Simple 5-star rating

**Phase 2** (3-6 months post-launch):
- Dual sender/traveler profiles
- Counter-offer negotiation
- Multi-criteria ratings
- Advanced filters
- Live tracking
- Tiered KYC
- Automated no-show handling
- In-app calling

**Rationale**:
- MVP proves core value: Can we match senders & travelers?
- Strip everything that's not essential to that question
- Launch fast, iterate based on real user feedback
- Don't build features users might not need

---

## Key Learnings from This Grilling

### 1. **Trust is Everything**
Every decision circles back to trust:
- KYC verification
- Package verification
- Liability policies
- Rating systems
- No-show consequences

Without trust, the platform dies.

### 2. **Balance Speed vs Safety**
- Instant notifications for matching speed
- But verification required for trust
- Trade-off: Fast onboarding (Level 1) vs Safe transactions (Level 2+)

### 3. **Fairness to Both Sides**
- Pricing formula: Fair to sender (affordable) AND traveler (compensates effort)
- Liability: Traveler liable BUT with value caps and risk-adjusted pay
- No-shows: Penalties proportional to offense

### 4. **Flexibility > Rigidity**
- Soft capacity guidelines (not hard limits)
- Traveler-driven scheduling (not fixed slots)
- Zone-based delivery (not fixed address)
- Users are adults, give them control

### 5. **Start Simple, Add Complexity Later**
- MVP: Single profile, simple rating, basic chat
- Phase 2: Dual profiles, multi-criteria, advanced features
- Validate core before building edge cases

---

## Decisions That Changed During Grilling

### Changed: Payment at Pickup → Payment at Match
**Why**: Payment failure at pickup = bad traveler experience. Pre-charge with escrow solves this.

### Changed: Single package only → Multiple packages
**Why**: Significantly increases traveler earnings. Complexity worth it.

### Changed: Light KYC → Tiered KYC
**Why**: Progressive disclosure. Let users choose their friction level.

### Changed: Single profile → Dual profiles
**Why**: Fair to separate sender reputation from traveler reputation.

---

## Questions We Still Need to Answer (Phase 2)

1. **International Routes**: How does customs, VAT, import duties work?
2. **Insurance**: Partner with insurance company or build own pool?
3. **Disputes**: What's the mediation process for "package damaged but traveler disputes"?
4. **Corporate Accounts**: Should businesses get bulk sender accounts?
5. **Traveler Partnerships**: Partner with airlines/travel agencies for traveler acquisition?
6. **Seasonal Peaks**: Diwali, holidays = high demand. Surge pricing?

---

*This grilling session took 23 questions to reach complete clarity on the product. Every question revealed edge cases and forced us to make explicit choices. This document is the foundation for building Quiko with confidence.*
