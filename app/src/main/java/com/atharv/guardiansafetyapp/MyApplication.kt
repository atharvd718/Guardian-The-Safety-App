package com.atharv.guardiansafetyapp

import android.app.Application

//   TO MAKE CONTEXT GLOBAL

class MyApplication: Application() {

    companion object{
        lateinit var instance:MyApplication
    }

    override fun onCreate() {
        super.onCreate()
        instance=this

    }
}