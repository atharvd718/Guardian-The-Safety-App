package com.atharv.guardiansafetyapp

import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.messaging.FirebaseMessaging

object FirebaseManager {

    // Lazy initialization of Firebase Auth
    val auth: FirebaseAuth by lazy {
        FirebaseAuth.getInstance()
    }

    // Lazy initialization of Firestore
    val firestore: FirebaseFirestore by lazy {
        FirebaseFirestore.getInstance()
    }

    // Lazy initialization of Firebase Cloud Messaging
    val messaging: FirebaseMessaging by lazy {
        FirebaseMessaging.getInstance()
    }
}
