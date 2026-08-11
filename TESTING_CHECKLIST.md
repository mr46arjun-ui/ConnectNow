# ConnectNow MVP - Critical User Flow Testing Checklist

## Pre-Testing Setup
- [ ] Clear browser cache and cookies
- [ ] Test on Chrome, Firefox, Safari (at least one)
- [ ] Test on mobile (iPhone/Android simulator or device)
- [ ] Ensure database is fresh/clean
- [ ] Ensure Redis is running
- [ ] Check all environment variables are set

## Flow 1: Authentication & Profile
- [ ] User can login via OAuth
- [ ] User profile displays correctly
- [ ] User can update profile (username, bio, age, country)
- [ ] Profile updates persist after page refresh
- [ ] Logout works and clears session
- [ ] Unauthorized users cannot access admin dashboard
- [ ] Error message shows on failed login

## Flow 2: Friends Management
- [ ] User can view friends list
- [ ] User can search for friends
- [ ] User can send friend request
- [ ] User can accept friend request
- [ ] User can reject friend request
- [ ] User can remove friend
- [ ] Friend list updates in real-time
- [ ] Empty state shows when no friends
- [ ] Loading state shows while fetching
- [ ] Error message shows on failed action

## Flow 3: Private Messaging
- [ ] User can select friend and view conversation
- [ ] User can send message
- [ ] Message appears immediately (optimistic update)
- [ ] Message persists after page refresh
- [ ] User can edit message
- [ ] User can delete message
- [ ] User can add emoji reaction
- [ ] User can remove emoji reaction
- [ ] User can use emoji picker in composer
- [ ] Typing indicator shows
- [ ] Read receipts work
- [ ] Messages scroll to latest
- [ ] Empty state shows when no messages
- [ ] Error message shows on failed send

## Flow 4: Group Chat
- [ ] User can create group
- [ ] User can add members to group
- [ ] User can remove members from group
- [ ] User can view group member list
- [ ] User can send message in group
- [ ] User can mention other members (@username)
- [ ] Mention autocomplete works
- [ ] Mentioned user is highlighted
- [ ] User can edit group settings
- [ ] Group info displays correctly
- [ ] Group updates in real-time for all members
- [ ] Error message shows on failed action

## Flow 5: Video Chat
- [ ] User can initiate video call
- [ ] Called user receives call notification
- [ ] Called user can accept call
- [ ] Called user can reject call
- [ ] Video streams appear for both users
- [ ] Audio works both directions
- [ ] User can toggle video on/off
- [ ] User can toggle audio on/off
- [ ] User can end call
- [ ] Call ends for both users
- [ ] Connection quality indicator shows
- [ ] Error message shows on connection failure
- [ ] Fallback works if WebRTC not supported

## Flow 6: Admin Dashboard
- [ ] Admin can access dashboard
- [ ] Non-admin cannot access dashboard
- [ ] Overview tab shows correct stats
- [ ] Users tab shows user list
- [ ] Admin can search users
- [ ] Admin can suspend user
- [ ] Admin can ban user
- [ ] Reports tab shows reports
- [ ] Admin can update report status
- [ ] Moderation tab shows flagged content
- [ ] Admin can approve/reject flags
- [ ] Analytics show correct data
- [ ] Health metrics display
- [ ] Loading state shows while fetching
- [ ] Error message shows on failed action

## Flow 7: Notifications
- [ ] User receives notification on friend request
- [ ] User receives notification on message
- [ ] User receives notification on mention
- [ ] Notification badge shows count
- [ ] User can mark notification as read
- [ ] User can delete notification
- [ ] Notification list updates in real-time
- [ ] Toast notification appears for real-time events

## Flow 8: Blocking & Reports
- [ ] User can block another user
- [ ] User can view blocked users list
- [ ] User can unblock user
- [ ] Blocked user cannot message
- [ ] User can report another user
- [ ] Report reason is required
- [ ] Report appears in admin queue
- [ ] Admin can view report details
- [ ] Admin can take action on report

## Performance Checks
- [ ] Page load time < 3 seconds
- [ ] Message send < 500ms
- [ ] Video call setup < 2 seconds
- [ ] No console errors
- [ ] No memory leaks (check DevTools)
- [ ] Smooth animations (60fps)
- [ ] No janky scrolling

## Mobile Responsiveness
- [ ] Layout works on 375px width (iPhone SE)
- [ ] Layout works on 768px width (iPad)
- [ ] Touch interactions work
- [ ] Buttons are easily tappable (44px+)
- [ ] Text is readable without zoom
- [ ] No horizontal scroll
- [ ] Modals fit on screen

## Accessibility
- [ ] Tab navigation works
- [ ] Focus indicators visible
- [ ] ARIA labels present
- [ ] Color contrast sufficient
- [ ] Keyboard shortcuts work
- [ ] Screen reader compatible (test with NVDA/JAWS)

## Security
- [ ] XSS protection: HTML tags in messages escaped
- [ ] CSRF protection: Form tokens present
- [ ] SQL injection: No errors with special characters
- [ ] Session: Cookie has secure flag
- [ ] HTTPS: Works over HTTPS
- [ ] Rate limiting: Spam attempts blocked

## Edge Cases
- [ ] Very long messages (5000+ chars)
- [ ] Emoji in messages
- [ ] Mentions with special characters
- [ ] Rapid clicks (double-click prevention)
- [ ] Network failure recovery
- [ ] Offline then online
- [ ] Browser tab in background
- [ ] Multiple tabs open
- [ ] Very large friend list (1000+)
- [ ] Very old messages (pagination)

## Browser Compatibility
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Chrome
- [ ] Mobile Safari

## Database
- [ ] Data persists across server restarts
- [ ] No duplicate messages
- [ ] No orphaned records
- [ ] Indexes working (queries fast)
- [ ] Backup/restore works

## Deployment
- [ ] Docker build succeeds
- [ ] Docker run succeeds
- [ ] Environment variables set correctly
- [ ] Database migrations applied
- [ ] Redis connection works
- [ ] WebSocket connections stable
- [ ] SSL/TLS certificate valid
- [ ] Health check endpoint responds

## Sign-Off
- [ ] All critical flows tested
- [ ] No critical bugs found
- [ ] Performance acceptable
- [ ] Mobile responsive
- [ ] Accessibility baseline met
- [ ] Ready for deployment

**Tested by**: ________________  
**Date**: ________________  
**Notes**: ________________________________________________
