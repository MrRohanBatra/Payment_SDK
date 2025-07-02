// plugins {
//     id("com.android.application")
//     id("kotlin-android")
//     id("dev.flutter.flutter-gradle-plugin")
// }

// android {
//     namespace = "com.example.testapp_sender"
//     compileSdk = flutter.compileSdkVersion
//     ndkVersion = "27.0.12077973"

//     compileOptions {
//         sourceCompatibility = JavaVersion.VERSION_11
//         targetCompatibility = JavaVersion.VERSION_11
//         isCoreLibraryDesugaringEnabled = true 
//     }

//     kotlinOptions {
//         jvmTarget = JavaVersion.VERSION_11.toString()
//     }

//     defaultConfig {
//         applicationId = "com.example.testapp_sender"
//         minSdk = flutter.minSdkVersion
//         targetSdk = flutter.targetSdkVersion
//         versionCode = flutter.versionCode
//         versionName = flutter.versionName
//     }
//     buildScript {
//         classpath("com.google.gms:google-services:4.4.1") // or latest
//     }

//     buildTypes {
//         release {
//             signingConfig = signingConfigs.getByName("debug")
//         }
//     }
// }

// dependencies {
//     coreLibraryDesugaring("com.android.tools:desugar_jdk_libs:2.1.4")
//     implementation("com.google.firebase:firebase-messaging:23.4.1")
// }
// apply plugin: 'com.google.gms.google-services'
plugins {
    id("com.android.application")
    id("kotlin-android")
    id("dev.flutter.flutter-gradle-plugin")
    id("com.google.gms.google-services")
}

android {
    namespace = "com.example.testapp_sender"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = "27.0.12077973"

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
        isCoreLibraryDesugaringEnabled = true
    }

    kotlinOptions {
        jvmTarget = JavaVersion.VERSION_11.toString()
    }

    defaultConfig {
        applicationId = "com.example.testapp_sender"
        minSdk = flutter.minSdkVersion
        targetSdk = flutter.targetSdkVersion
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    buildTypes {
        release {
            signingConfig = signingConfigs.getByName("debug")
        }
    }
}

dependencies {
    coreLibraryDesugaring("com.android.tools:desugar_jdk_libs:2.1.4")
    
    // ✅ Firebase Messaging
    implementation("com.google.firebase:firebase-messaging:23.4.1")
}

// ✅ Firebase plugin to read google-services.json
// apply plugin: "com.google.gms.google-services"