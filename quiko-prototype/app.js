// Quiko Mobile App Prototype
// State Management
const appState = {
    currentScreen: 'splash',
    user: null,
    role: null, // 'sender' or 'traveler'
    currentListing: null,
    selectedMatch: null,
    mockData: {
        travelers: [
            {
                id: 1,
                name: 'Raj Kumar',
                rating: 4.8,
                deliveries: 35,
                transport: '✈️ Flight',
                trustScore: 168,
                verified: true,
                from: 'Chennai',
                to: 'Mumbai',
                date: '2026-07-17',
                pickupWindow: '10am - 1pm',
                deliveryWindow: '6pm - 9pm',
                capacity: '10kg',
                dimensions: '40×40×40'
            },
            {
                id: 2,
                name: 'Priya Sharma',
                rating: 4.6,
                deliveries: 18,
                transport: '🚂 Train',
                trustScore: 82,
                verified: true,
                from: 'Chennai',
                to: 'Mumbai',
                date: '2026-07-17',
                pickupWindow: '8am - 11am',
                deliveryWindow: '8pm - 11pm',
                capacity: '8kg',
                dimensions: '50×50×50'
            },
            {
                id: 3,
                name: 'Vikram Singh',
                rating: 4.9,
                deliveries: 52,
                transport: '✈️ Flight',
                trustScore: 254,
                verified: true,
                from: 'Chennai',
                to: 'Mumbai',
                date: '2026-07-17',
                pickupWindow: '12pm - 3pm',
                deliveryWindow: '5pm - 8pm',
                capacity: '15kg',
                dimensions: '40×40×40'
            }
        ],
        packages: [
            {
                id: 1,
                sender: 'Ananya Patel',
                senderRating: 4.7,
                packagesSent: 12,
                weight: '3kg',
                dimensions: '30×30×30',
                value: '₹2,000',
                category: '👕 Clothes',
                from: 'Chennai',
                to: 'Mumbai',
                date: '2026-07-17',
                offering: '₹250',
                pickupArea: 'T Nagar',
                deliveryArea: 'Andheri'
            },
            {
                id: 2,
                sender: 'Rahul Desai',
                senderRating: 4.5,
                packagesSent: 8,
                weight: '2kg',
                dimensions: '25×25×25',
                value: '₹1,500',
                category: '📚 Books',
                from: 'Chennai',
                to: 'Mumbai',
                date: '2026-07-17',
                offering: '₹180',
                pickupArea: 'Anna Nagar',
                deliveryArea: 'Bandra'
            },
            {
                id: 3,
                sender: 'Meera Joshi',
                senderRating: 4.9,
                packagesSent: 25,
                weight: '5kg',
                dimensions: '40×35×30',
                value: '₹5,000',
                category: '📱 Electronics',
                from: 'Chennai',
                to: 'Mumbai',
                date: '2026-07-17',
                offering: '₹450',
                pickupArea: 'Velachery',
                deliveryArea: 'Powai'
            }
        ]
    }
};

// Screen Templates
const screens = {
    splash: () => `
        <div class="screen active" id="splash-screen">
            <div class="content content-centered">
                <div class="logo-container">
                    <div class="logo">Q</div>
                    <h1 style="font-size: 32px; margin-bottom: 8px;">Quiko</h1>
                    <p class="tagline">Just Quick As That ⚡</p>
                </div>
                <button class="btn btn-primary" onclick="navigateTo('login')">Get Started</button>
            </div>
        </div>
    `,

    login: () => `
        <div class="screen active" id="login-screen">
            <div class="header">
                <button class="header-back" onclick="navigateTo('splash')">←</button>
                <div class="header-title">Login</div>
                <div style="width: 40px;"></div>
            </div>
            <div class="content">
                <div class="logo-container">
                    <div class="logo" style="width: 80px; height: 80px; font-size: 32px;">Q</div>
                </div>

                <div class="form-group">
                    <label class="form-label">Phone Number</label>
                    <input type="tel" class="form-input" placeholder="+91 98765 43210" id="phone-input">
                </div>

                <button class="btn btn-primary" onclick="sendOTP()">Send OTP</button>

                <p style="text-align: center; margin-top: 20px; color: var(--gray-medium); font-size: 14px;">
                    New user? OTP will create your account
                </p>
            </div>
        </div>
    `,

    otp: () => `
        <div class="screen active" id="otp-screen">
            <div class="header">
                <button class="header-back" onclick="navigateTo('login')">←</button>
                <div class="header-title">Enter OTP</div>
                <div style="width: 40px;"></div>
            </div>
            <div class="content content-centered">
                <p style="text-align: center; margin-bottom: 30px; color: var(--gray-medium);">
                    Enter the 4-digit code sent to<br><strong>+91 98765 43210</strong>
                </p>

                <div class="otp-container">
                    <input type="text" maxlength="1" class="otp-input" id="otp1" oninput="moveToNext(this, 'otp2')">
                    <input type="text" maxlength="1" class="otp-input" id="otp2" oninput="moveToNext(this, 'otp3')">
                    <input type="text" maxlength="1" class="otp-input" id="otp3" oninput="moveToNext(this, 'otp4')">
                    <input type="text" maxlength="1" class="otp-input" id="otp4" oninput="verifyOTP()">
                </div>

                <button class="btn btn-primary" onclick="verifyOTP()">Verify</button>

                <p style="text-align: center; margin-top: 20px; color: var(--gray-medium); font-size: 14px;">
                    Didn't receive? <a href="#" style="color: var(--primary-black); font-weight: bold;">Resend OTP</a>
                </p>
            </div>
        </div>
    `,

    home: () => `
        <div class="screen active" id="home-screen">
            <div class="header">
                <div class="header-title">Welcome, User! 👋</div>
                <button class="header-action" onclick="logout()">Logout</button>
            </div>
            <div class="content">
                <div class="home-card" onclick="selectRole('sender')">
                    <div class="home-card-icon">📦</div>
                    <div class="home-card-title">Send a Package</div>
                    <div class="home-card-desc">Find travelers going your route</div>
                </div>

                <div class="home-card" onclick="selectRole('traveler')">
                    <div class="home-card-icon">✈️</div>
                    <div class="home-card-title">Carry Packages</div>
                    <div class="home-card-desc">Earn money on your trip</div>
                </div>
            </div>
        </div>
    `,

    createPackage: () => `
        <div class="screen active" id="create-package-screen">
            <div class="header">
                <button class="header-back" onclick="navigateTo('home')">←</button>
                <div class="header-title">Create Package</div>
                <div style="width: 40px;"></div>
            </div>
            <div class="content">
                <div class="form-group">
                    <label class="form-label">📍 From</label>
                    <input type="text" class="form-input" placeholder="Chennai" value="Chennai">
                </div>

                <div class="form-group">
                    <label class="form-label">📍 To</label>
                    <input type="text" class="form-input" placeholder="Mumbai" value="Mumbai">
                </div>

                <div class="form-group">
                    <label class="form-label">📅 Travel Date</label>
                    <input type="date" class="form-input" value="2026-07-17">
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">⚖️ Weight (kg)</label>
                        <input type="number" class="form-input" placeholder="3" value="3">
                    </div>
                    <div class="form-group">
                        <label class="form-label">💰 Value (₹)</label>
                        <input type="number" class="form-input" placeholder="2000" value="2000">
                    </div>
                </div>

                <div class="form-row-3">
                    <div class="form-group">
                        <label class="form-label">📏 L (cm)</label>
                        <input type="number" class="form-input form-input-small" placeholder="30" value="30">
                    </div>
                    <div class="form-group">
                        <label class="form-label">W (cm)</label>
                        <input type="number" class="form-input form-input-small" placeholder="30" value="30">
                    </div>
                    <div class="form-group">
                        <label class="form-label">H (cm)</label>
                        <input type="number" class="form-input form-input-small" placeholder="30" value="30">
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">📦 Category</label>
                    <select class="form-input">
                        <option>👕 Clothes</option>
                        <option>📚 Books</option>
                        <option>📱 Electronics (Small)</option>
                        <option>🍫 Food (Packaged)</option>
                        <option>🎁 Gifts</option>
                        <option>📄 Documents</option>
                    </select>
                </div>

                <div class="price-display">
                    <div class="price-label">Calculated Max Price</div>
                    <div class="price-amount">₹283</div>
                    <div class="price-breakdown">You can offer up to this amount</div>
                </div>

                <div class="form-group">
                    <label class="form-label">Your Offer</label>
                    <input type="range" min="150" max="283" value="250" class="form-input" style="height: 40px;" oninput="updateOfferValue(this.value)">
                    <div style="text-align: center; font-size: 24px; font-weight: bold; margin-top: 8px;">₹<span id="offer-value">250</span></div>
                </div>

                <button class="btn btn-primary" onclick="navigateTo('browseTravelers')">Find Travelers</button>
            </div>
        </div>
    `,

    browseTravelers: () => `
        <div class="screen active" id="browse-travelers-screen">
            <div class="header">
                <button class="header-back" onclick="navigateTo('createPackage')">←</button>
                <div class="header-title">Available Travelers</div>
                <button class="header-action" onclick="alert('Filter options')">🔍</button>
            </div>
            <div class="content">
                <p style="color: var(--gray-medium); margin-bottom: 16px; font-size: 14px;">
                    ${appState.mockData.travelers.length} travelers match your route
                </p>

                ${appState.mockData.travelers.map(traveler => `
                    <div class="card" onclick="viewTraveler(${traveler.id})">
                        <div class="card-header">
                            <div>
                                <div class="card-title">${traveler.name}</div>
                                <div class="rating">
                                    <span class="stars">⭐ ${traveler.rating}</span>
                                    <span style="color: var(--gray-medium); font-size: 13px;">(${traveler.deliveries} trips)</span>
                                </div>
                            </div>
                            ${traveler.verified ? '<span class="badge badge-verified">✓ Verified</span>' : ''}
                        </div>

                        <div class="card-info">
                            <div class="info-row">
                                <span class="info-icon">${traveler.transport}</span>
                                <span>${traveler.from} → ${traveler.to}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-icon">📅</span>
                                <span>${traveler.date}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-icon">⚖️</span>
                                <span>Capacity: ${traveler.capacity}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-icon">⏰</span>
                                <span>Pickup: ${traveler.pickupWindow}</span>
                            </div>
                        </div>

                        <button class="btn btn-primary btn-small" onclick="event.stopPropagation(); sendRequest(${traveler.id}, 'traveler')">Send Request</button>
                    </div>
                `).join('')}
            </div>
        </div>
    `,

    createTrip: () => `
        <div class="screen active" id="create-trip-screen">
            <div class="header">
                <button class="header-back" onclick="navigateTo('home')">←</button>
                <div class="header-title">Create Trip</div>
                <div style="width: 40px;"></div>
            </div>
            <div class="content">
                <div class="form-group">
                    <label class="form-label">📍 From</label>
                    <input type="text" class="form-input" placeholder="Chennai - T Nagar" value="Chennai - T Nagar">
                </div>

                <div class="form-group">
                    <label class="form-label">📍 To</label>
                    <input type="text" class="form-input" placeholder="Mumbai - Andheri" value="Mumbai - Andheri">
                </div>

                <div class="form-group">
                    <label class="form-label">📅 Travel Date</label>
                    <input type="date" class="form-input" value="2026-07-17">
                </div>

                <div class="form-group">
                    <label class="form-label">✈️ Transport Mode</label>
                    <select class="form-input">
                        <option>✈️ Flight</option>
                        <option>🚂 Train</option>
                        <option>🚌 Bus</option>
                    </select>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">⏰ Pickup Window</label>
                        <input type="text" class="form-input" placeholder="10am-1pm" value="10am-1pm">
                    </div>
                    <div class="form-group">
                        <label class="form-label">⏰ Delivery Window</label>
                        <input type="text" class="form-input" placeholder="6pm-9pm" value="6pm-9pm">
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">⚖️ Capacity (kg)</label>
                        <input type="number" class="form-input" placeholder="10" value="10">
                        <p class="helper-text">Soft guideline, you can adjust</p>
                    </div>
                    <div class="form-group">
                        <label class="form-label">📏 Max Size</label>
                        <select class="form-input">
                            <option>30×30×30</option>
                            <option selected>40×40×40</option>
                            <option>50×50×50</option>
                        </select>
                    </div>
                </div>

                <button class="btn btn-primary" onclick="navigateTo('browsePackages')">Find Packages</button>
            </div>
        </div>
    `,

    browsePackages: () => `
        <div class="screen active" id="browse-packages-screen">
            <div class="header">
                <button class="header-back" onclick="navigateTo('createTrip')">←</button>
                <div class="header-title">Available Packages</div>
                <button class="header-action" onclick="alert('Filter options')">🔍</button>
            </div>
            <div class="content">
                <div style="background: var(--primary-yellow); padding: 12px; border-radius: 12px; margin-bottom: 16px;">
                    <strong>Your capacity:</strong> 0kg / 10kg used
                </div>

                <p style="color: var(--gray-medium); margin-bottom: 16px; font-size: 14px;">
                    ${appState.mockData.packages.length} packages match your route
                </p>

                ${appState.mockData.packages.map(pkg => `
                    <div class="card" onclick="viewPackage(${pkg.id})">
                        <div class="card-header">
                            <div>
                                <div class="card-title">${pkg.weight} - ${pkg.category}</div>
                                <div style="font-size: 14px; color: var(--gray-dark); margin-top: 4px;">
                                    From ${pkg.sender} <span class="stars">⭐ ${pkg.senderRating}</span>
                                </div>
                            </div>
                            <div class="card-badge">${pkg.offering}</div>
                        </div>

                        <div class="card-info">
                            <div class="info-row">
                                <span class="info-icon">📍</span>
                                <span>${pkg.from} → ${pkg.to}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-icon">📅</span>
                                <span>${pkg.date}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-icon">📦</span>
                                <span>${pkg.dimensions} | Value: ${pkg.value}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-icon">📍</span>
                                <span>Pickup: ${pkg.pickupArea} | Delivery: ${pkg.deliveryArea}</span>
                            </div>
                        </div>

                        <button class="btn btn-primary btn-small" onclick="event.stopPropagation(); sendRequest(${pkg.id}, 'package')">Send Request</button>
                    </div>
                `).join('')}
            </div>
        </div>
    `,

    matchConfirmed: () => `
        <div class="screen active" id="match-confirmed-screen">
            <div class="content content-centered">
                <div class="match-animation">
                    <div class="match-icon">🎉</div>
                    <h2 class="match-title">It's a Match!</h2>
                    <p class="match-subtitle">You've been matched with ${appState.role === 'sender' ? 'Raj Kumar' : 'Ananya Patel'}</p>
                </div>

                <div class="card" style="width: 100%; margin-bottom: 20px;">
                    <div class="card-header">
                        <div class="card-title">${appState.role === 'sender' ? 'Traveler' : 'Sender'} Details</div>
                    </div>
                    <div class="card-info">
                        <div class="info-row">
                            <span class="info-icon">👤</span>
                            <span>${appState.role === 'sender' ? 'Raj Kumar' : 'Ananya Patel'}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-icon">⭐</span>
                            <span>${appState.role === 'sender' ? '4.8' : '4.7'} rating</span>
                        </div>
                        <div class="info-row">
                            <span class="info-icon">📅</span>
                            <span>July 17, 2026</span>
                        </div>
                        <div class="info-row">
                            <span class="info-icon">⏰</span>
                            <span>Pickup: 10am - 1pm</span>
                        </div>
                        <div class="info-row">
                            <span class="info-icon">💰</span>
                            <span>Amount: ₹250</span>
                        </div>
                    </div>
                </div>

                ${appState.role === 'sender' ? `
                    <button class="btn btn-primary" onclick="processPayment()">Pay ₹250 Now</button>
                    <p style="text-align: center; margin-top: 12px; font-size: 13px; color: var(--gray-medium);">
                        Secure escrow payment<br>You'll get 100% refund if cancelled >24hrs before
                    </p>
                ` : `
                    <button class="btn btn-primary" onclick="navigateTo('chat')">Chat with Sender</button>
                    <p style="text-align: center; margin-top: 12px; font-size: 13px; color: var(--gray-medium);">
                        You'll earn ₹245 (₹250 - 2% commission)
                    </p>
                `}
            </div>
        </div>
    `,

    payment: () => `
        <div class="screen active" id="payment-screen">
            <div class="header">
                <button class="header-back" onclick="navigateTo('matchConfirmed')">←</button>
                <div class="header-title">Payment</div>
                <div style="width: 40px;"></div>
            </div>
            <div class="content">
                <div class="price-display" style="margin-top: 0;">
                    <div class="price-label">Total Amount</div>
                    <div class="price-amount">₹250</div>
                    <div class="price-breakdown">Traveler gets ₹245 | Quiko ₹5 (2%)</div>
                </div>

                <div class="form-group">
                    <label class="form-label">Payment Method</label>
                    <select class="form-input">
                        <option>💳 UPI</option>
                        <option>💳 Credit/Debit Card</option>
                        <option>💰 Wallet</option>
                    </select>
                </div>

                <div class="form-group">
                    <label class="form-label">UPI ID</label>
                    <input type="text" class="form-input" placeholder="yourname@upi">
                </div>

                <div style="background: var(--gray-light); padding: 16px; border-radius: 12px; margin: 20px 0; font-size: 13px;">
                    <strong>🔒 Safe & Secure</strong>
                    <ul style="margin-top: 8px; padding-left: 20px;">
                        <li>Money held in escrow until delivery</li>
                        <li>100% refund if cancelled >24hrs before</li>
                        <li>Traveler gets paid only after OTP confirmation</li>
                    </ul>
                </div>

                <button class="btn btn-primary" onclick="confirmPayment()">Pay ₹250</button>
            </div>
        </div>
    `,

    chat: () => `
        <div class="screen active" id="chat-screen">
            <div class="header">
                <button class="header-back" onclick="navigateTo('home')">←</button>
                <div class="header-title">${appState.role === 'sender' ? 'Raj Kumar' : 'Ananya Patel'}</div>
                <button class="header-action" onclick="alert('Profile')">👤</button>
            </div>

            <div class="chat-container">
                <div class="chat-messages" id="chat-messages">
                    ${appState.role === 'sender' ? `
                        <div class="message message-received">
                            <div>Hi Ananya! I'll be picking up your package on July 17th.</div>
                            <div class="message-time">9:30 AM</div>
                        </div>
                        <div class="message message-sent">
                            <div>Great! Can we meet at T Nagar junction at 11:30am?</div>
                            <div class="message-time">9:32 AM</div>
                        </div>
                        <div class="message message-received">
                            <div>Perfect! I'll be wearing a blue shirt. See you then.</div>
                            <div class="message-time">9:35 AM</div>
                        </div>
                    ` : `
                        <div class="message message-sent">
                            <div>Hi Ananya! I can carry your package on my trip to Mumbai.</div>
                            <div class="message-time">9:30 AM</div>
                        </div>
                        <div class="message message-received">
                            <div>Wonderful! When can you pick it up?</div>
                            <div class="message-time">9:32 AM</div>
                        </div>
                        <div class="message message-sent">
                            <div>I can meet you between 10am-1pm. T Nagar area works for you?</div>
                            <div class="message-time">9:35 AM</div>
                        </div>
                    `}
                </div>

                <div class="quick-actions">
                    <button class="quick-btn" onclick="sendQuickMessage('I\\'m here')">📍 I'm here</button>
                    <button class="quick-btn" onclick="sendQuickMessage('Running 10 mins late')">⏰ Running late</button>
                    <button class="quick-btn" onclick="sendQuickMessage('Can\\'t find you')">❓ Can't find you</button>
                    <button class="quick-btn" onclick="alert('Calling...')">📞 Call</button>
                </div>

                <div class="chat-input-container">
                    <input type="text" class="chat-input" placeholder="Type a message..." id="chat-input">
                    <button class="chat-send-btn" onclick="sendChatMessage()">➤</button>
                </div>
            </div>
        </div>
    `,

    pickupConfirmation: () => `
        <div class="screen active" id="pickup-confirmation-screen">
            <div class="header">
                <button class="header-back" onclick="navigateTo('chat')">←</button>
                <div class="header-title">Confirm Pickup</div>
                <div style="width: 40px;"></div>
            </div>
            <div class="content">
                <h3 style="margin-bottom: 16px;">Package Verification</h3>

                <div class="card">
                    <div class="card-header">
                        <div class="card-title">Package Details</div>
                    </div>
                    <div class="card-info">
                        <div class="info-row">
                            <span class="info-icon">⚖️</span>
                            <span>Weight: 3kg</span>
                        </div>
                        <div class="info-row">
                            <span class="info-icon">📦</span>
                            <span>Dimensions: 30×30×30 cm</span>
                        </div>
                        <div class="info-row">
                            <span class="info-icon">💰</span>
                            <span>Declared Value: ₹2,000</span>
                        </div>
                        <div class="info-row">
                            <span class="info-icon">👕</span>
                            <span>Category: Clothes</span>
                        </div>
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">📸 Upload Package Photo</label>
                    <div style="border: 2px dashed var(--gray-medium); border-radius: 12px; padding: 40px; text-align: center; cursor: pointer;" onclick="alert('Camera opened')">
                        <div style="font-size: 48px;">📷</div>
                        <p style="margin-top: 12px; color: var(--gray-medium);">Tap to take photo</p>
                    </div>
                </div>

                <div style="background: var(--gray-light); padding: 16px; border-radius: 12px; margin: 20px 0;">
                    <label style="display: flex; align-items: start; gap: 12px; cursor: pointer;">
                        <input type="checkbox" style="margin-top: 4px;">
                        <span style="font-size: 13px;">
                            <strong>I verify that:</strong><br>
                            • Package matches description<br>
                            • No prohibited items<br>
                            • I accept liability for declared value (₹2,000)
                        </span>
                    </label>
                </div>

                <button class="btn btn-primary" onclick="confirmPickup()">Confirm Pickup</button>
            </div>
        </div>
    `,

    delivery: () => `
        <div class="screen active" id="delivery-screen">
            <div class="header">
                <div class="header-title">Delivery</div>
            </div>
            <div class="content content-centered">
                <div style="text-align: center; margin-bottom: 40px;">
                    <div style="font-size: 80px;">📦</div>
                    <h2 style="font-size: 24px; margin: 20px 0;">Ready to Deliver</h2>
                    <p style="color: var(--gray-medium);">Ask receiver for OTP to complete delivery</p>
                </div>

                <div class="card" style="width: 100%;">
                    <div class="card-header">
                        <div class="card-title">Receiver Details</div>
                    </div>
                    <div class="card-info">
                        <div class="info-row">
                            <span class="info-icon">👤</span>
                            <span>Meera Joshi</span>
                        </div>
                        <div class="info-row">
                            <span class="info-icon">📞</span>
                            <span>+91 98765 12345</span>
                        </div>
                        <div class="info-row">
                            <span class="info-icon">📍</span>
                            <span>Andheri West, Mumbai</span>
                        </div>
                    </div>
                </div>

                <h3 style="margin: 30px 0 20px;">Enter Receiver's OTP</h3>

                <div class="otp-container">
                    <input type="text" maxlength="1" class="otp-input" id="delivery-otp1" oninput="moveToNext(this, 'delivery-otp2')">
                    <input type="text" maxlength="1" class="otp-input" id="delivery-otp2" oninput="moveToNext(this, 'delivery-otp3')">
                    <input type="text" maxlength="1" class="otp-input" id="delivery-otp3" oninput="moveToNext(this, 'delivery-otp4')">
                    <input type="text" maxlength="1" class="otp-input" id="delivery-otp4" oninput="verifyDelivery()">
                </div>

                <button class="btn btn-primary" onclick="verifyDelivery()">Complete Delivery</button>
            </div>
        </div>
    `,

    rating: () => `
        <div class="screen active" id="rating-screen">
            <div class="content content-centered">
                <div style="text-align: center; margin-bottom: 40px;">
                    <div style="font-size: 80px;">⭐</div>
                    <h2 style="font-size: 24px; margin: 20px 0;">Rate Your Experience</h2>
                    <p style="color: var(--gray-medium);">How was your experience with ${appState.role === 'sender' ? 'Raj Kumar' : 'Ananya Patel'}?</p>
                </div>

                <div class="rating-input">
                    <button class="star-btn" onclick="setRating(1)">⭐</button>
                    <button class="star-btn" onclick="setRating(2)">⭐</button>
                    <button class="star-btn" onclick="setRating(3)">⭐</button>
                    <button class="star-btn" onclick="setRating(4)">⭐</button>
                    <button class="star-btn" onclick="setRating(5)">⭐</button>
                </div>

                <div class="form-group" style="width: 100%;">
                    <label class="form-label">Comments (Optional)</label>
                    <textarea class="form-input" rows="4" placeholder="Share your experience..."></textarea>
                </div>

                <button class="btn btn-primary" onclick="submitRating()">Submit Rating</button>
                <button class="btn btn-outline" onclick="navigateTo('home')" style="margin-top: 12px;">Skip</button>
            </div>
        </div>
    `,

    success: () => `
        <div class="screen active" id="success-screen">
            <div class="content content-centered">
                <div class="match-animation">
                    <div class="match-icon">✅</div>
                    <h2 class="match-title">Success!</h2>
                    <p class="match-subtitle">${appState.role === 'sender' ? 'Your package was delivered successfully' : 'You earned ₹245!'}</p>
                </div>

                ${appState.role === 'traveler' ? `
                    <div class="price-display">
                        <div class="price-label">Payment Received</div>
                        <div class="price-amount">₹245</div>
                        <div class="price-breakdown">Added to your Quiko wallet</div>
                    </div>
                ` : ''}

                <button class="btn btn-primary" onclick="navigateTo('home')">Back to Home</button>
            </div>
        </div>
    `
};

// Navigation Function
function navigateTo(screenName) {
    const container = document.getElementById('app-container');
    container.innerHTML = screens[screenName]();
    appState.currentScreen = screenName;

    // Auto-focus first input on some screens
    if (screenName === 'login') {
        setTimeout(() => document.getElementById('phone-input')?.focus(), 100);
    }
    if (screenName === 'otp') {
        setTimeout(() => document.getElementById('otp1')?.focus(), 100);
    }
}

// Helper Functions
function moveToNext(current, nextFieldId) {
    if (current.value.length === 1) {
        const nextField = document.getElementById(nextFieldId);
        if (nextField) nextField.focus();
    }
}

function updateOfferValue(value) {
    document.getElementById('offer-value').textContent = value;
}

function sendOTP() {
    const phone = document.getElementById('phone-input').value;
    if (phone) {
        navigateTo('otp');
    } else {
        alert('Please enter your phone number');
    }
}

function verifyOTP() {
    // Simulate OTP verification
    setTimeout(() => {
        appState.user = { phone: '+91 98765 43210', name: 'User' };
        navigateTo('home');
    }, 500);
}

function logout() {
    appState.user = null;
    appState.role = null;
    navigateTo('splash');
}

function selectRole(role) {
    appState.role = role;
    if (role === 'sender') {
        navigateTo('createPackage');
    } else {
        navigateTo('createTrip');
    }
}

function viewTraveler(id) {
    const traveler = appState.mockData.travelers.find(t => t.id === id);
    appState.selectedMatch = traveler;
    alert(`Viewing ${traveler.name}'s profile\n\nRating: ${traveler.rating}★\nDeliveries: ${traveler.deliveries}\nTransport: ${traveler.transport}\n\nIn a full app, this would show detailed profile.`);
}

function viewPackage(id) {
    const pkg = appState.mockData.packages.find(p => p.id === id);
    appState.selectedMatch = pkg;
    alert(`Viewing package from ${pkg.sender}\n\nWeight: ${pkg.weight}\nValue: ${pkg.value}\nCategory: ${pkg.category}\nOffering: ${pkg.offering}\n\nIn a full app, this would show detailed package info.`);
}

function sendRequest(id, type) {
    alert(`Request sent! Waiting for ${type === 'traveler' ? 'traveler' : 'sender'} to accept...`);
    setTimeout(() => {
        navigateTo('matchConfirmed');
    }, 1000);
}

function processPayment() {
    navigateTo('payment');
}

function confirmPayment() {
    alert('Payment processing...');
    setTimeout(() => {
        alert('✅ Payment successful! Money held in escrow.');
        navigateTo('chat');
    }, 1500);
}

function sendQuickMessage(message) {
    const messagesContainer = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message message-sent';
    messageDiv.innerHTML = `
        <div>${message}</div>
        <div class="message-time">Just now</div>
    `;
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function sendChatMessage() {
    const input = document.getElementById('chat-input');
    if (input.value.trim()) {
        sendQuickMessage(input.value);
        input.value = '';
    }
}

function confirmPickup() {
    alert('✅ Pickup confirmed! Package is now in your custody.');
    navigateTo('delivery');
}

function verifyDelivery() {
    alert('Verifying OTP...');
    setTimeout(() => {
        navigateTo('rating');
    }, 1000);
}

function setRating(stars) {
    const buttons = document.querySelectorAll('.star-btn');
    buttons.forEach((btn, index) => {
        if (index < stars) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

function submitRating() {
    alert('Thank you for your feedback!');
    navigateTo('success');
}

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    navigateTo('splash');
});
