# EventHub: Component Specifications & UI Design

**Document Version**: 1.0  
**Last Updated**: March 23, 2026  
**Status**: Production-Ready

---

## Table of Contents

1. [Component Architecture](#component-architecture)
2. [Screen Specifications](#screen-specifications)
3. [TypeScript Interfaces](#typescript-interfaces)
4. [Animation System](#animation-system)
5. [Theme System](#theme-system)
6. [Responsive Design](#responsive-design)

---

## 1. Component Architecture

### 1.1 Component Hierarchy

```
App
├── RootNavigator
│   ├── AuthStack
│   │   ├── SplashScreen
│   │   ├── SignupScreen
│   │   ├── LoginScreen
│   │   └── OTPVerificationScreen
│   │
│   └── AppStack
│       ├── TabNavigator
│       │   ├── DiscoveryStack
│       │   │   ├── HomeScreen (Feed)
│       │   │   ├── EventDetailScreen
│       │   │   ├── SearchScreen
│       │   │   └── FilterModal
│       │   │
│       │   ├── HostingStack
│       │   │   ├── HostingDashboardScreen
│       │   │   ├── CreateEventScreen (Multi-step)
│       │   │   │   ├── BasicInfoStep
│       │   │   │   ├── SkillStep
│       │   │   │   ├── ThemeCustomizeStep
│       │   │   │   ├── ScheduleVenueStep
│       │   │   │   ├── PricingStep
│       │   │   │   ├── RulesStep
│       │   │   │   └── ReviewStep
│       │   │   ├── EventManagementScreen
│       │   │   └── AttendeeCheckInScreen
│       │   │
│       │   ├── BookingStack
│       │   │   ├── MyBookingsScreen
│       │   │   ├── BookingDetailScreen
│       │   │   └── PaymentScreen
│       │   │
│       │   ├── ChatStack
│       │   │   ├── ChatListScreen
│       │   │   ├── ChatScreen
│       │   │   └── ChatInviteScreen
│       │   │
│       │   └── ProfileStack
│       │       ├── ProfileScreen
│       │       ├── RatingsScreen
│       │       ├── LeaderboardScreen
│       │       ├── RewardCoinsScreen
│       │       └── SettingsScreen
│       │
│       └── ModalStack
│           ├── PaymentMethodModal
│           ├── FilterModal
│           ├── ThemePreviewModal
│           └── ReviewModal
```

### 1.2 Reusable Components

**Layout Components**:
- `SafeAreaContainer` - Status bar + safe area wrapper
- `HeaderBar` - Top navigation (title, back, menu)
- `BottomTabBar` - Main navigation tabs
- `BottomSheet` - Modal drawer from bottom

**Content Components**:
- `EventCard` - Event preview with custom theme
- `EventCardThemed` - Dynamic theme rendering
- `HostCard` - Host profile + ratings
- `ParallaxHero` - Scrolling image with text overlay
- `RatingBadge` - Star rating display
- `PaymentMethodPicker` - UPI/Card/Wallet selector
- `ThemePreview` - Live theme preview for customization

**Form Components**:
- `TextInput` - Themed input field
- `PhoneInput` - Formatted phone entry
- `DatePicker` - Calendar selection
- `ColorPicker` - Hex color selector
- `FontSelector` - Dropdown with font previews
- `PriceSlider` - Range picker for fees

---

## 2. Screen Specifications

### 2.1 SplashScreen

**Purpose**: App initialization, brand presence, auth check

**Layout**:
```
┌─────────────────────────────────┐
│                                 │
│        🎉 EventHub Logo         │
│       "Empower Creators"        │
│                                 │
│     [Loading spinner...]        │
│                                 │
│   "Discovering Events..."       │
│                                 │
└─────────────────────────────────┘
```

**Behavior**:
- Display 2 seconds minimum
- Check JWT token in secure storage
- If valid token: Auto-redirect to HomeScreen
- If no token: Route to SignupScreen
- Poll device status (location permission, etc.)

**TypeScript**:
```typescript
interface SplashScreenProps {}

const SplashScreen: React.FC<SplashScreenProps> = () => {
  const { user, isLoading } = useAuth();
  
  useEffect(() => {
    setTimeout(() => {
      if (user) {
        navigation.replace('Home');
      } else {
        navigation.replace('Signup');
      }
    }, 2000);
  }, [user]);

  return (
    <SafeAreaContainer>
      <Center>
        <Logo size={120} />
        <Text variant="displayMedium" mt={16}>"Empower Creators"</Text>
        <ActivityIndicator size="large" color={THEME.primary} mt={32} />
        <Text variant="bodyMedium" mt={16} color="gray">Discovering Events...</Text>
      </Center>
    </SafeAreaContainer>
  );
};
```

### 2.2 HomeScreen (Discovery Feed)

**Purpose**: Personalized event discovery with custom themes

**Layout**:
```
┌─────────────────────────────────┐
│ ▼ Bangalore        🔍 Search   │ Header
├─────────────────────────────────┤
│                                 │
│ 📍 What's near you? ─────────── │
│                                 │
│ [Carousel: Recent Events]       │ Event cards with custom theme
│  ┌──-─────────┐ ┌──────────┐   │
│  │ 🏃 Running │ │ 🧘 Yoga  │   │
│  │ 6:30 AM    │ │ 7:00 AM  │   │
│  └──-─────────┘ └──────────┘   │
│                                 │
│ 💛 FOR YOU (Personalized) ──── │
│  ┌──────────────────────────┐   │
│  │ 🎾 Tennis - Intermediate │   │
│  │ Sun 4:00 PM              │   │
│  │ [Join & Pay Button]      │   │
│  └──────────────────────────┘   │
│                                 │
│ 👥 FRIENDS' EVENTS ─────────── │
│  [Friends' upcoming events]     │
│                                 │
└─────────────────────────────────┘
```

**Interactions**:
- Pull-to-refresh fetches new events
- Tap event card → EventDetailScreen
- Location dropdown opens LocationPicker
- Search icon → SearchScreen
- Infinite scroll pagination

**TypeScript**:
```typescript
interface HomeScreenProps extends ScreenProps {
  navigation: NavigationProp<RootParamList, 'Home'>;
}

interface FeedItem {
  type: 'carousel' | 'event' | 'section_header';
  data: Event | string;
  theme?: EventTheme;
}

const HomeScreen: React.FC<HomeScreenProps> = () => {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const { events, personalizedEvents } = useEvents();
  const { location } = useLocation();

  useEffect(() => {
    buildFeed();
  }, [events, personalizedEvents]);

  const buildFeed = () => {
    const items: FeedItem[] = [
      { type: 'section_header', data: 'Recent Events' },
      { type: 'carousel', data: recentEvents },
      { type: 'section_header', data: 'For You' },
      ...personalizedEvents.map(e => ({ type: 'event', data: e, theme: e.theme })),
    ];
    setFeedItems(items);
  };

  return (
    <SafeAreaContainer>
      <FlatList
        data={feedItems}
        renderItem={({ item }) => renderFeedItem(item)}
        keyExtractor={(item, idx) => `${item.type}-${idx}`}
        onRefresh={handleRefresh}
        refreshing={isLoading}
        onEndReached={loadMore}
      />
    </SafeAreaContainer>
  );
};
```

### 2.3 EventDetailScreen (Custom Theme)

**Purpose**: Full event information with dynamic theming

**Layout** (Yoga example - soft blue theme):
```
┌─────────────────────────────────┐
│ ◄ [Close]    [Hero Image]  [Share]
│  (scrolls up)
│
│ 🧘 Sunday Yoga Session
│ With Priya (Verified) ⭐ 4.8★
│
│ 📍 Indiranagar Park
│ 📅 Sunday 6:00-7:30 AM
│ 💰 ₹500 • 12/15 Joined
│
│ [Host Card: Priya with follow btn]
│
│ About
│ Gentle morning yoga for all levels.
│ Bring your own mat...
│
│ Reviews (2 shown, load more)
│ ⭐⭐⭐⭐⭐ "Amazing energy!"
│
│ People Joining
│ [Avatar1] [Avatar2] +5 more
│
│ [💜 Join & Pay Now]
│
└─────────────────────────────────┘
```

**Theme Integration**:
- Header background: Primary color (#4DB8C6 for yoga)
- Button color: Secondary color (#2D7A81)
- Font style: Elegant serif
- Icons: Meditation symbols

**TypeScript**:
```typescript
interface EventDetailScreenProps {
  route: RouteProp<RootParamList, 'EventDetail'>;
}

interface EventDetailState {
  event: Event | null;
  host: User | null;
  reviews: Review[];
  attendees: User[];
  isLoading: boolean;
  error: string | null;
}

const EventDetailScreen: React.FC<EventDetailScreenProps> = ({ route }) => {
  const { event_id } = route.params;
  const [state, setState] = useState<EventDetailState>({
    event: null,
    host: null,
    reviews: [],
    attendees: [],
    isLoading: true,
    error: null
  });

  useEffect(() => {
    fetchEventDetail();
  }, [event_id]);

  const fetchEventDetail = async () => {
    try {
      const { data } = await apolloClient.query({
        query: GET_EVENT_DETAIL,
        variables: { id: event_id }
      });
      setState(prev => ({ ...prev, ...data, isLoading: false }));
    } catch (err) {
      setState(prev => ({ ...prev, error: err.message, isLoading: false }));
    }
  };

  if (state.isLoading) return <LoadingSpinner />;

  const { event, host } = state;
  const themeColors = event?.theme_primary_color || '#FF5733';

  return (
    <SafeAreaContainer style={{ backgroundColor: themeColors }}>
      <FlatList
        data={[event, ...state.reviews]}
        renderItem={({ item }) => renderDetailItem(item)}
        ListFooterComponent={renderJoinButton}
      />
    </SafeAreaContainer>
  );
};
```

### 2.4 CreateEventScreen (7-Step Wizard)

**Step 1: Basic Event Info**

```
┌─────────────────────────────────┐
│ ◄ Create Event  (Step 1/7)      │
├─────────────────────────────────┤
│ Event Type                      │
│ [Dropdown: Football, Yoga, ...] │
│ (Selection suggests fee: ₹99)   │
│                                 │
│ Event Name                      │
│ [Input: SundayYoga...]          │
│                                 │
│ Description                     │
│ [TextArea: Max 500 chars]       │
│                                 │
│ Cover Image                     │
│ [📷 Upload Image Button]        │
│                                 │
│ [Next Step ▶]                   │
│                                 │
└─────────────────────────────────┘
```

**Step 3: Theme Customization**

```
┌─────────────────────────────────┐
│ ◄ Create Event  (Step 3/7)      │
├─────────────────────────────────┤
│ Theme & Customization           │
│                                 │
│ Suggested Theme (Event-Based)   │
│ [📌 Calm & Peaceful] (Yoga)     │
│                                 │
│ OR Customize:                   │
│ Primary Color                   │
│ [🎨 Color Picker] #4DB8C6      │
│                                 │
│ Secondary Color (Buttons)       │
│ [🎨 Color Picker] #2D7A81      │
│                                 │
│ Font Style                      │
│ ○ Playful  ○ Prof  ○ Elegant   │
│                                 │
│ Live Preview:                   │
│ ┌──────────────────────────┐   │
│ │ Custom Event Title       │   │
│ │ ₹500 • [Join Now]        │   │
│ │ (Shows theme applied)    │   │
│ └──────────────────────────┘   │
│                                 │
│ [Continue ▶]                    │
│                                 │
└─────────────────────────────────┘
```

**TypeScript**:
```typescript
interface CreateEventFormState {
  step: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  basicInfo: {
    eventType: string;
    title: string;
    description: string;
    coverImageUrl: string;
  };
  skillSettings: {
    skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'mixed';
    minPlayers: number;
    maxPlayers: number;
  };
  theme: {
    primaryColor: string;
    secondaryColor: string;
    fontStyle: 'playful' | 'professional' | 'elegant';
    backgroundPattern: 'solid' | 'gradient' | 'pattern';
  };
  schedule: {
    eventDate: Date;
    startTime: string;
    endTime: string;
    venue: Venue;
  };
  pricing: {
    entryFeeType: 'free' | 'paid_per_person';
    entryFeeAmount: number;
  };
  rules: {
    equipmentRequired: string;
    houseRules: string;
    cancellationPolicy: string;
  };
}

interface CreateEventScreenProps {
  navigation: NavigationProp;
}

const CreateEventScreen: React.FC<CreateEventScreenProps> = ({ navigation }) => {
  const [formState, setFormState] = useState<CreateEventFormState>({
    step: 1,
    basicInfo: { eventType: '', title: '', description: '', coverImageUrl: '' },
    // ... rest of state
  });

  const nextStep = () => {
    setFormState(prev => ({
      ...prev,
      step: Math.min(7, prev.step + 1) as any
    }));
  };

  const renderStep = () => {
    switch (formState.step) {
      case 1: return <BasicInfoStep state={formState} setState={setFormState} />;
      case 2: return <SkillStep state={formState} setState={setFormState} />;
      case 3: return <ThemeCustomizeStep state={formState} setState={setFormState} />;
      case 4: return <ScheduleVenueStep state={formState} setState={setFormState} />;
      case 5: return <PricingStep state={formState} setState={setFormState} />;
      case 6: return <RulesStep state={formState} setState={setFormState} />;
      case 7: return <ReviewStep state={formState} onPublish={handlePublish} />;
    }
  };

  return (
    <SafeAreaContainer>
      {renderStep()}
      <HStack justifyContent="space-between" mt={24}>
        {formState.step > 1 && <Button onPress={() => setFormState(prev => ({ ...prev, step: prev.step - 1 }))}>Back</Button>}
        {formState.step < 7 && <Button onPress={nextStep}>Next</Button>}
      </HStack>
    </SafeAreaContainer>
  );
};
```

### 2.5 EventManagementScreen (Host Dashboard)

**Purpose**: Host controls for attendance, communication, revenue

```
┌─────────────────────────────────┐
│ 🧘 Sunday Yoga Session          │ Header with quick stats
│ Next: Sunday, 6:00 AM           │
│                                 │
│ Players: 12/15 [=====-----]     │
│ Revenue: ₹6,300 (85%)           │
│ Rating: ⭐ 4.7 (8 reviews)      │
│                                 │
├─────────────────────────────────┤
│ ATTENDEES                       │
│ ┌──────────────────────────┐   │
│ │ [Avatar] Neha            │   │
│ │ Intermediate • Paid      │   │
│ │ [✓ Check-in]  [Message]  │   │
│ └──────────────────────────┘   │
│ ┌──────────────────────────┐   │
│ │ [Avatar] Aman            │   │
│ │ Beginner • Paid          │   │
│ │ [✓ Check-in]  [Message]  │   │
│ └──────────────────────────┘   │
│ [Load More ▼]                   │
│                                 │
│ ACTIONS                         │
│ [✎ Edit]  [💬 Broadcast]       │
│ [📱 QR Check-in]  [⚙ Settings] │
│                                 │
│ GROUP CHAT                      │
│ "Let's meet at parking..."      │
│                                 │
└─────────────────────────────────┘
```

**TypeScript**:
```typescript
interface Attendee {
  user_id: string;
  name: string;
  avatar_url: string;
  skill_level: string;
  payment_status: 'paid' | 'pending' | 'failed';
  checked_in: boolean;
  no_show: boolean;
}

interface EventManagementScreenProps {
  route: RouteProp<RootParamList, 'EventManagement'>;
}

const EventManagementScreen: React.FC<EventManagementScreenProps> = ({ route }) => {
  const { event_id } = route.params;
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [event, setEvent] = useState<Event | null>(null);

  const renderAttendee = (attendee: Attendee) => (
    <HStack key={attendee.user_id} p={12} borderBottomWidth={1} borderBottomColor="gray.100">
      <Avatar source={{ uri: attendee.avatar_url }} size="md" />
      <VStack flex={1} ml={12}>
        <Text fontWeight="600">{attendee.name}</Text>
        <Text fontSize="sm" color="gray">{attendee.skill_level}</Text>
      </VStack>
      <HStack space={8}>
        <Button size="sm" variant="outline" onPress={() => handleCheckIn(attendee.user_id)}>
          {attendee.checked_in ? '✓' : '○'}
        </Button>
        <Button size="sm" variant="outline" onPress={() => messageAttendee(attendee.user_id)}>
          💬
        </Button>
      </HStack>
    </HStack>
  );

  return (
    <SafeAreaContainer>
      <ScrollView>
        <EventStatsCard event={event} />
        <Divider my={16} />
        <Heading>Attendees</Heading>
        {attendees.map(renderAttendee)}
      </ScrollView>
    </SafeAreaContainer>
  );
};
```

### 2.6 ChatScreen (Real-Time Group Messaging)

**Purpose**: Event group chat with typing indicators

```
┌─────────────────────────────────┐
│ ◄ Sunday Yoga • 3 online        │
├─────────────────────────────────┤
│                                 │
│ [Avatar] Priya (Host)           │
│ "Let's gather by the entrance"  │
│ 10:05 AM                        │
│                                 │
│          [Avatar] You           │
│          "On my way! 🚗"         │
│          10:07 AM               │
│                                 │
│ [Avatar] Neha                   │
│ "See you soon!"                 │
│ 10:08 AM                        │
│ [👍 1]                          │
│                                 │
│ [Avatar1] [Avatar2] typing...   │
│                                 │
├─────────────────────────────────┤
│ [Input] "Type message..."  [🔊] │
│                                 │
└─────────────────────────────────┘
```

**TypeScript**:
```typescript
interface ChatMessage {
  id: string;
  user_id: string;
  text: string;
  created_at: Date;
  reactions: { [emoji: string]: number };
}

interface ChatScreenProps {
  route: RouteProp<RootParamList, 'Chat'>;
}

const ChatScreen: React.FC<ChatScreenProps> = ({ route }) => {
  const { event_id } = route.params;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const WebSocketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    connectWebSocket();
  }, [event_id]);

  const connectWebSocket = () => {
    const ws = new WebSocket(`wss://api.eventhub.app/ws?token=${getToken()}&event_id=${event_id}`);
    
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'message') {
        setMessages(prev => [...prev, message.data]);
      } else if (message.type === 'typing_indicator') {
        setTypingUsers(prev => [...prev, message.user_id]);
      }
    };

    WebSocketRef.current = ws;
  };

  const sendMessage = () => {
    const message = { type: 'message', text: inputText, event_id };
    WebSocketRef.current?.send(JSON.stringify(message));
    setInputText('');
  };

  return (
    <SafeAreaContainer>
      <FlatList
        data={messages}
        renderItem={({ item }) => <ChatBubble message={item} />}
        keyExtractor={item => item.id}
        inverted
      />
      {typingUsers.length > 0 && <TypingIndicator users={typingUsers} />}
      <HStack p={12} borderTopWidth={1}>
        <TextInput
          flex={1}
          placeholder="Type message..."
          value={inputText}
          onChangeText={setInputText}
        />
        <Button onPress={sendMessage} ml={8}>Send</Button>
      </HStack>
    </SafeAreaContainer>
  );
};
```

---

## 3. TypeScript Interfaces

### 3.1 Domain Models

```typescript
// User Model
interface User {
  id: string;
  phone_number: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  profile_picture_url?: string;
  bio?: string;
  is_verified: boolean;
  verification_type?: 'aadhaar' | 'pan' | 'driving_license';
  role: 'participant' | 'host' | 'admin' | 'moderator';
  account_status: 'active' | 'suspended' | 'banned';
  created_at: Date;
}

// Event Model
interface Event {
  id: string;
  host_id: string;
  event_type: string;
  title: string;
  description: string;
  cover_image_url?: string;
  
  // Theme
  theme: EventTheme;
  
  // Location
  location: {
    latitude: number;
    longitude: number;
    address: string;
    venue_name?: string;
  };
  
  // Schedule
  event_date: Date;
  start_time: string;
  end_time: string;
  timezone: string;
  is_recurring: boolean;
  
  // Details
  skill_level: 'beginner' | 'intermediate' | 'advanced' | 'mixed';
  max_players: number;
  gender_preference: 'open' | 'women_only' | 'men_only' | 'co_ed';
  
  // Pricing
  entry_fee_type: 'free' | 'paid_per_person';
  entry_fee_amount?: number;
  
  // Status
  status: 'draft' | 'published' | 'live' | 'completed' | 'cancelled';
  average_rating?: number;
  total_ratings?: number;
  
  created_at: Date;
}

// Theme Model
interface EventTheme {
  primary_color: string;      // '#4DB8C6'
  secondary_color: string;
  text_color: 'light' | 'dark';
  font_style: 'playful' | 'professional' | 'elegant';
  background_pattern: 'solid' | 'gradient' | 'pattern';
  preset_name?: string;
}

// Booking Model
interface Booking {
  id: string;
  event_id: string;
  user_id: string;
  amount_paid: number;
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
  rsvp_status: 'confirmed' | 'pending' | 'cancelled' | 'waitlist';
  attended: boolean;
  is_no_show: boolean;
  created_at: Date;
}

// Rating Model
interface Rating {
  id: string;
  event_id?: string;
  rater_id: string;
  rated_user_id?: string;
  rating_type: 'event' | 'host' | 'peer';
  overall_rating: 1 | 2 | 3 | 4 | 5;
  written_review?: string;
  is_anonymous: boolean;
  created_at: Date;
}
```

### 3.2 State Management (Zustand Stores)

```typescript
// Auth Store
interface AuthStore {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  
  signup: (phone: string, otp: string) => Promise<void>;
  login: (phone: string, otp: string) => Promise<void>;
  logout: () => void;
  validateToken: () => Promise<boolean>;
  updateUser: (userData: Partial<User>) => void;
}

// Event Store
interface EventStore {
  events: Event[];
  currentEvent: Event | null;
  homeEvents: Event[];
  searchResults: Event[];
  isLoading: boolean;
  filter: EventFilter;
  
  fetchHomeEvents: (location: Location) => Promise<void>;
  searchEvents: (query: string, filters: EventFilter) => Promise<void>;
  getEventDetail: (eventId: string) => Promise<Event>;
  createEvent: (formData: CreateEventFormState) => Promise<Event>;
  updateEvent: (eventId: string, data: Partial<Event>) => Promise<void>;
}

// Booking Store
interface BookingStore {
  bookings: Booking[];
  currentBooking: Booking | null;
  isProcessing: boolean;
  error: string | null;
  
  fetchUserBookings: () => Promise<void>;
  createBooking: (eventId: string, paymentMethod: string) => Promise<Booking>;
  cancelBooking: (bookingId: string) => Promise<void>;
}

// UI Store
interface UIStore {
  theme: Theme;
  bottomSheetOpen: boolean;
  filterModalOpen: boolean;
  
  setTheme: (theme: Theme) => void;
  toggleBottomSheet: () => void;
  toggleFilterModal: () => void;
}
```

---

## 4. Animation System

### 4.1 Parallax Hero Animation

**Concept**: Image scales + hero text fades based on scroll offset

```typescript
interface ParallaxHeroProps {
  imageUrl: string;
  title: string;
  subtitle?: string;
  onScroll: Animated.ValueXY;
}

const ParallaxHero: React.FC<ParallaxHeroProps> = ({
  imageUrl, title, subtitle, onScroll
}) => {
  const imageScale = onScroll.y.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 1.5],
    extrapolate: 'clamp'
  });

  const titleOpacity = onScroll.y.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0],
    extrapolate: 'clamp'
  });

  return (
    <Animated.View style={[
      styles.hero,
      { transform: [{ scaleY: imageScale }] }
    ]}>
      <Image source={{ uri: imageUrl }} style={styles.image} />
      <Animated.Text style={[styles.title, { opacity: titleOpacity }]}>
        {title}
      </Animated.Text>
    </Animated.View>
  );
};
```

### 4.2 Slide-In List Animation

**Concept**: Each event card slides in from bottom with stagger

```typescript
const SlideInList: React.FC<SlideInListProps> = ({ items }) => {
  const animations = items.map(() => useSharedValue(-300));

  useEffect(() => {
    items.forEach((_, index) => {
      animations[index].value = withTiming(0, {
        duration: 400,
        easing: Easing.out(Easing.cubic)
      }, null, () => {})(50 * index);  // Stagger
    });
  }, [items]);

  return (
    <FlatList
      data={items}
      renderItem={({ item, index }) => (
        <Animated.View style={[
          { transform: [{ translateY: animations[index] }] }
        ]}>
          <EventCard event={item} />
        </Animated.View>
      )}
    />
  );
};
```

### 4.3 Gesture-Driven Scale

**Concept**: Pinch gesture controls event card expansion

```typescript
const GestureDrivenCard: React.FC<GestureDrivenCardProps> = ({ event }) => {
  const scale = useSharedValue(1);
  const panGesture = Gesture.Pan()
    .onUpdate(event => {
      scale.value = Math.max(1, Math.min(1.5, 1 + event.translationX / 100));
    })
    .onEnd(() => {
      scale.value = withSpring(1);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={animatedStyle}>
        <EventCard event={event} />
      </Animated.View>
    </GestureDetector>
  );
};
```

---

## 5. Theme System

### 5.1 Theme Presets (Event-Type Based)

```typescript
const THEME_PRESETS: Record<string, EventTheme> = {
  yoga: {
    primary_color: '#4DB8C6',
    secondary_color: '#2D7A81',
    text_color: 'dark',
    font_style: 'elegant',
    background_pattern: 'gradient',
    preset_name: 'Calm & Peaceful'
  },
  
  football: {
    primary_color: '#FF5733',
    secondary_color: '#FFC300',
    text_color: 'light',
    font_style: 'professional',
    background_pattern: 'solid',
    preset_name: 'Dynamic Energy'
  },
  
  book_club: {
    primary_color: '#2C3E50',
    secondary_color: '#ECF0F1',
    text_color: 'light',
    font_style: 'elegant',
    background_pattern: 'pattern',
    preset_name: 'Literary Elegance'
  },
  
  cacao_ceremony: {
    primary_color: '#8B4513',
    secondary_color: '#D2691E',
    text_color: 'light',
    font_style: 'playful',
    background_pattern: 'gradient',
    preset_name: 'Warm Ritual'
  }
};
```

### 5.2 Dynamic Theme Application

```typescript
const applyTheme = (event: Event): StyleSheet.NamedStyles<any> => {
  const theme = event.theme;
  
  return StyleSheet.create({
    card: {
      backgroundColor: theme.primary_color,
      borderRadius: 12
    },
    button: {
      backgroundColor: theme.secondary_color
    },
    text: {
      color: theme.text_color === 'dark' ? '#000' : '#FFF',
      fontFamily: getFontFamily(theme.font_style)
    }
  });
};

const getFontFamily = (style: string): string => {
  switch (style) {
    case 'playful': return 'Fredoka';
    case 'professional': return 'Poppins';
    case 'elegant': return 'PlayfairDisplay';
    default: return 'Inter';
  }
};
```

---

## 6. Responsive Design

### 6.1 Breakpoints

```typescript
const SIZES = {
  xs: 0,
  sm: 480,
  md: 768,
  lg: 1024,
  xl: 1280
};

const isSmallScreen = screenWidth < SIZES.sm;
const isMediumScreen = screenWidth >= SIZES.sm && screenWidth < SIZES.md;
const isLargeScreen = screenWidth >= SIZES.md;
```

### 6.2 Layout Adjustments

**Small Screen (Mobile)**:
- Single column list
- Full-width cards
- Bottom tabs navigation

**Medium Screen (Tablet in Portrait)**:
- Two-column grid for events
- Side panel for filters

**Large Screen (Tablet in Landscape)**:
- Three-column grid
- Drawer navigation

---

**Document Status**: Ready for Implementation  
**Next Step**: Create API endpoint specifications with examples

