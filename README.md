# CollabX - Collaborative Coding Platform

A full-stack MERN application for real-time collaborative coding with multi-language compiler support, cursor tracking, and live notifications.

## 🚀 Features

- ✅ **Real-time Collaboration**: Code together with live synchronization via Socket.io
- ✅ **Multi-Language Support**: JavaScript, Python, and Java execution
- ✅ **Monaco Editor**: Professional code editor with syntax highlighting
- ✅ **Cursor Tracking**: See where other users are typing with color-coded labels
- ✅ **Language Change Notifications**: Popup alerts when users switch languages
- ✅ **Shared Output Display**: Code execution results sync across all users
- ✅ **Real-time Chat**: Integrated chat system below the user list for team communication
- ✅ **Instant Compilation**: Compile and run code without leaving the platform
- ✅ **User List**: See who's in your coding room
- ✅ **Room Codes**: Share 6-character codes to invite collaborators
- ✅ **Professional UI**: Modern dark theme IDE-like interface

## 📋 System Requirements

### Server Requirements
- **Node.js**: v16+ (v22.14.0 recommended)
- **Python**: v3.7+ (for Python code execution)
- **Java JDK**: v8+ (for Java code execution)
- **npm**: v6+ (comes with Node.js)

### Verified On
- Node.js v22.14.0 ✅
- Python 3.13.1 ✅
- Java 23.0.1 ✅

## 🛠️ Installation & Setup

### 1. Prerequisites Check

Verify your system has the required tools:

```bash
# Check Node.js
node --version
npm --version

# Check Python
python --version

# Check Java
javac -version
java -version
```

### 2. Install Dependencies

```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 3. Start the Application

**Terminal 1 - Backend Server** (from `server` directory):
```bash
node server.js
```

Expected output:
```
Server running on port 5000
```

**Terminal 2 - Frontend Development Server** (from `client` directory):
```bash
npm run dev
```

Expected output:
```
VITE v7.3.1 ready in 1xxx ms
Local: http://localhost:5173/
```

### 4. Access the Application

Open your browser and navigate to: **http://localhost:5173**

## 💻 Usage Guide

### Creating a Room
1. Enter your name on the home page
2. Click **Create Room** to generate a unique code
3. Share the code with collaborators

### Joining a Room
1. Enter your name
2. Click **Join Room**
3. Enter the 6-character room code
4. Click **Join**

### Collaborative Features

#### Real-time User Synchronization
- User lists update instantly when people join/leave rooms
- All users see the same participant list in real-time
- Complete room state synchronization (code, language, chat history)

#### Cursor Tracking
- See where other users are typing with color-coded markers
- User names appear as labels next to their cursors
- Each user gets a unique color automatically

#### Language Change Notifications
- When one user changes the programming language, others get a popup notification
- Shows which user changed the language and to what language
- Requires confirmation to proceed

#### Shared Code Execution
- Run code and see results instantly shared with all users
- Supports JavaScript, Python, and Java
- Both success and error outputs are synchronized

#### Real-time Chat
- Type messages in the chat box below the user list
- Messages appear instantly for all users in the room
- User names are color-coded to match their cursor colors
- Chat history persists during the session

## 🧪 Testing Guide

### Quick Test (30 seconds)

1. **Open Two Browser Windows**
   ```
   Browser 1: http://localhost:5173
   Browser 2: http://localhost:5173 (private/incognito window)
   ```

2. **Create & Join Room**
   - Browser 1 (Alice): Create Room → Copy code (e.g., ABC123)
   - Browser 2 (Bob): Join Room → Paste ABC123

3. **Test Language Change**
   - Alice: Change dropdown to Python
   - Bob: See popup "Alice changed language to PYTHON" → Click OK
   - Both: See Python syntax highlighting

4. **Test Output Sharing**
   - Alice: Type `console.log("Hello from Alice!");` → Click Compile & Run
   - Bob: See output "Hello from Alice!" appear instantly

5. **Test Cursor Tracking**
   - Alice: Move cursor to different lines
   - Bob: See colored marker `▌` with "Alice" label at cursor position

6. **Test Real-time Chat**
   - Alice: Type "Hello everyone!" in chat box and press Enter
   - Bob: See "Alice: Hello everyone!" appear instantly in chat
   - Bob: Reply with "Hi Alice!"
   - Alice: See Bob's message with his color-coded name

### Complete Feature Testing

#### User Synchronization
- [ ] All users in same room see identical user lists
- [ ] User count updates correctly when people join/leave
- [ ] New users appear instantly for everyone
- [ ] Leaving users are removed instantly for everyone
- [ ] Complete room state syncs for new users (code, language, chat)

#### Code Synchronization
- [ ] Code changes appear instantly for all users
- [ ] Language changes sync with notifications
- [ ] Output execution results share across all users
- [ ] No synchronization delays or missing updates
- [ ] Notification popup appears when language changes
- [ ] Shows correct user name and new language
- [ ] OK button dismisses modal
- [ ] Both editors update language and highlighting

#### Output Sharing
- [ ] User 1 runs code → User 2 sees output instantly
- [ ] Output matches exactly between users
- [ ] Error messages shared (red text)
- [ ] Success output shared (green text)

#### Cursor Tracking
- [ ] User A moves cursor → User B sees marker at exact position
- [ ] Color-coded labels show user names
- [ ] Multiple cursors visible simultaneously
- [ ] Smooth updates during rapid movement

#### Real-time Chat
- [ ] Messages send instantly to all users
- [ ] Chat history loads for new users joining
- [ ] User names are color-coded in chat
- [ ] Messages appear in chronological order
- [ ] No duplicate messages
- [ ] Chat persists during session

## 📊 Backend Setup Status

| Component | Status | Version |
|-----------|--------|---------|
| Node.js | ✅ Installed | 22.14.0 |
| Python | ✅ Installed | 3.13.1 |
| Java JDK | ✅ Installed | 23.0.1 |
| G++/GCC | ❌ Not installed | - |
| Express | ✅ Running | 5.2.1 |
| Socket.io | ✅ Running | 4.8.3 |

## 🎯 Supported Languages & Execution

### JavaScript ✅
- **Engine**: VM2 Sandbox
- **Timeout**: 5 seconds
- **Features**: Full ES6+ support, console output capture, safe execution
- **Global Objects**: Math, Date, String, Array, Object, JSON, RegExp

### Python ✅
- **Engine**: Native Subprocess
- **Timeout**: 10 seconds
- **Features**: Python 3.13.1, full standard library, standard/error output capture

### Java ✅
- **Engine**: Compiled Execution
- **Timeout**: 10 seconds
- **Features**: JDK 23.0.1, automatic class wrapping, full OOP support

### C++ / C ❌
- **Status**: Not available (g++ not installed)
- **Note**: Can be added if compiler is installed

## 🧪 Verification Tests

All three languages tested with 100% pass rate:

### Basic Tests
- Hello World output
- Arithmetic operations
- Simple loops

### Advanced Tests
- Fibonacci sequences
- Prime number filtering
- Factorial calculations
- Array operations
- Object/Dictionary manipulation
- List comprehensions
- Class definitions

## 🔧 Technical Architecture

### Backend Services
```
Server: http://localhost:5000
✓ REST API endpoints (/api/rooms, /api/compile)
✓ Socket.io real-time events
✓ Code compilation API
✓ Room management (in-memory)
```

### Frontend Services
```
Dev Server: http://localhost:5173
✓ Home page (room creation/joining)
✓ Collaborative editor (Monaco)
✓ Real-time updates
✓ Professional IDE interface
```

### Socket.io Events

**Real-time Collaboration:**
- `join-room` → `room-joined` (initial room data)
- `code-change` → `code-update` (live code sync)
- `language-change` → `language-changed` (language notifications)
- `output-change` → `output-shared` (execution results)
- `cursor-move` → `cursor-moved` (cursor positions)
- `send-chat-message` → `chat-message` (chat messages)

### Execution Engines

**JavaScript (VM2 Sandbox):**
```javascript
const vm = new VM({
  timeout: 5000,
  sandbox: { console, Math, Date, String, Array, Object, JSON, RegExp }
});
```

**Python (Subprocess):**
```javascript
execFile('python', ['-c', code], { timeout: 10000 });
```

**Java (Compile + Execute):**
```javascript
// Auto-wrap in class, compile, then execute
const wrappedCode = `public class Main { public static void main(String[] args) { ${code} } }`;
```

## 📁 Project Structure

```
collabx/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Home.jsx          # Room creation/joining
│   │   │   ├── Room.jsx          # Main collaborative editor
│   │   │   └── LanguageChangeModal.jsx  # Notification popup
│   │   ├── services/
│   │   │   └── compilerService.js # API client
│   │   └── App.jsx               # React Router setup
│   ├── package.json
│   └── vite.config.js
├── server/                 # Node.js backend
│   ├── server.js           # Express + Socket.io server
│   ├── test.js             # Basic compiler tests
│   ├── test-advanced.js    # Complex algorithm tests
│   ├── package.json
│   └── .env                # Port configuration
└── README.md              # This file
```

## 🎨 UI Features

### Dark Theme IDE Interface
- VS Code-inspired design
- Monaco Editor integration
- Gradient backgrounds and animations
- Responsive layout (250px sidebar, fullscreen editor)

### Real-time Indicators
- User presence list in sidebar
- Status bar with language indicator
- Animated connection status dot
- Color-coded cursor markers
- Real-time chat with user-colored names

### Modal System
- Language change notifications
- Gradient styling with animations
- Bell icon and smooth transitions
- Semi-transparent overlays

## 🐛 Troubleshooting

### Multi-User Synchronization Issues

**Problem: User 2 doesn't see User 1's code changes, user list, or chat**

1. **Browser Console Check** (Press F12):
   - Look for "Socket initialized" and "Room joined" messages
   - Check for any red error messages
   - If you see WebSocket errors, the connection didn't establish

2. **Network Connection** (F12 → Network tab):
   - Search for "localhost:5000" or "ws://"
   - Should see active WebSocket connection
   - Status should be "101 Switching Protocols"
   - If missing, backend isn't reachable

3. **Verify Room Codes Match**:
   - Room codes are case-sensitive
   - Must be exactly 6 characters
   - Both users must enter identical codes

4. **Kill All Node Processes & Restart**:
   ```bash
   taskkill /f /im node.exe
   # Then restart both servers
   cd server && node server.js
   cd client && npm run dev
   ```

5. **Check CORS Configuration**:
   - Server should allow connections from ports: 5173, 5174, 5175, 5176, 3000
   - Verify in `server/server.js` CORS settings

### Chat Messages Not Appearing

**Solution**: 
- Verify Socket.io connection is established (check Network tab)
- Messages should appear in browser console first
- If not in console, socket emit failed
- Check server terminal for any "chat-message" event logs

### Cursor Tracking Not Working

**Solution**:
- Ensure other users see colored cursor markers in editor
- Click in editor to ensure focus
- Move cursor around - should see updates from other users in 100-200ms
- If no markers appear, check Monaco Editor decorations API in browser console

### Code Not Syncing

**Solution**:
- Type in editor and check immediate appearance in other browser
- Check browser console logs for "Code update received" messages
- Verify language matches (different languages might not show changes)
- Try typing a single character to test minimal change

### Server Won't Start
```bash
# Check if port 5000 is available
netstat -ano | findstr :5000

# Kill process if needed
taskkill /PID <PID> /F

# Restart server
cd server && node server.js
```

### Frontend Won't Load
```bash
# Clear node_modules and reinstall
cd client
rmdir /s /q node_modules
del package-lock.json
npm install
npm run dev
```

### Compiler Errors
```bash
# Test compilers individually
cd server
node test.js          # Basic tests
node test-advanced.js # Complex tests
```

### Socket.io Issues
- Check browser console (F12) for connection errors
- Verify both servers are running and ports accessible
- Check Windows Firewall: Allow Node.js through firewall
- Try clearing browser cache: Ctrl+Shift+Delete
- Restart browser completely

## 🚀 Production Deployment

### Environment Setup
```bash
# Set production environment variables
NODE_ENV=production
PORT=5000
```

### Build Frontend
```bash
cd client
npm run build
```

### Serve Static Files
```javascript
// In server.js
app.use(express.static(path.join(__dirname, '../client/dist')));
```

### Process Management
```bash
# Use PM2 for production
npm install -g pm2
pm2 start server/server.js --name collabx
```

## 📈 Performance Notes

- **Cursor Tracking**: Minimal overhead, throttled updates
- **Code Sync**: Real-time with efficient diffing
- **Execution**: Sandboxed JavaScript, subprocess isolation
- **Memory**: In-memory room storage (suitable for development)

## 🔮 Future Enhancements

- [ ] Database persistence (MongoDB)
- [ ] User authentication
- [ ] Code history/versioning
- [ ] Chat functionality
- [ ] File upload/sharing
- [ ] C++/C compiler support
- [ ] Multiple file support
- [ ] Code formatting/linting
- [ ] Theme customization
- [ ] Mobile responsiveness

## 📞 Support

### Development Notes
- Frontend: Hot reload enabled with Vite dev server
- Testing: Run individual test files from server directory
- Monitor: Check server terminal for event logs and errors

## 📋 Quick Reference

```bash
# Start backend
cd server && node server.js

# Start frontend (in another terminal)
cd client && npm run dev

# Test compilers
cd server && node test.js

# Kill all node processes (if needed)
taskkill /f /im node.exe

# Open browser
http://localhost:5173
```

**Ready to collaborate? Start coding together with CollabX! 🚀**

**Happy coding! 🎉**