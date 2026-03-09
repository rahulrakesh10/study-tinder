# Study Tinder

A mobile app that helps students find study buddies through a Tinder-style swipe interface, with location-based verification to confirm you're actually studying together.

## Overview

Study Tinder connects students who want to study together. Swipe right on classmates you'd like to study with, match with them, then verify your study sessions by proving you're in the same physical location—no more ghosting or fake study groups.

## Features

- **Swipe to Match** — Browse potential study buddies with a card-based interface. Swipe right to like, left to pass.
- **Matches** — View your matches and coordinate study sessions with Host/Join actions.
- **Location Verification** — Host a session by generating a QR code at your study spot. Partners scan it to verify they're within 20 meters, earning study streaks.
- **Leaderboard** — Compete with other students on a points-based leaderboard.
- **User Profiles** — Set up your profile with name and major.
- **Daily Swipes** — Free users get a limited number of swipes per day (premium unlocks unlimited).

## Tech Stack

- **React Native** + **Expo** — Cross-platform mobile app
- **Firebase** — Authentication and Firestore database
- **React Navigation** — Screen navigation
- **expo-camera** — QR code scanning for session verification
- **expo-location** — GPS-based proximity check
- **react-native-deck-swiper** — Tinder-style card swiping
- **react-native-qrcode-svg** — QR code generation