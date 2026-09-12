import os
import sys
import shutil
import zipfile
import subprocess

PROJECT_ROOT = r"C:\Users\cageg\.gemini\antigravity-ide\scratch\susurow"
ORIG_APK = os.path.join(PROJECT_ROOT, "SusuRow.apk")
DIST_DIR = os.path.join(PROJECT_ROOT, "frontend", "dist")
PUBLIC_APK = os.path.join(PROJECT_ROOT, "frontend", "public", "SusuRow.apk")

BUILD_TOOLS_DIR = r"C:\Users\cageg\AppData\Local\Android\Sdk\build-tools\36.1.0"
ZIPALIGN = os.path.join(BUILD_TOOLS_DIR, "zipalign.exe")
APKSIGNER = os.path.join(BUILD_TOOLS_DIR, "apksigner.bat")
KEYTOOL = r"C:\Program Files\Java\jdk-17\bin\keytool.exe"

TEMP_DIR = os.path.join(PROJECT_ROOT, "temp_apk_build")
UNALIGNED_APK = os.path.join(TEMP_DIR, "unaligned.apk")
ALIGNED_APK = os.path.join(TEMP_DIR, "aligned.apk")
DEBUG_KEYSTORE = os.path.join(TEMP_DIR, "debug.keystore")

def main():
    if os.path.exists(TEMP_DIR):
        shutil.rmtree(TEMP_DIR)
    os.makedirs(TEMP_DIR, exist_ok=True)

    print("1. Reading original APK and replacing assets/public with latest dist...")
    with zipfile.ZipFile(ORIG_APK, 'r') as zin:
        with zipfile.ZipFile(UNALIGNED_APK, 'w', zipfile.ZIP_DEFLATED) as zout:
            # Copy all files EXCEPT assets/public and old signature blocks
            for item in zin.infolist():
                if item.filename.startswith("assets/public/"):
                    continue
                if item.filename.startswith("META-INF/") and (item.filename.endswith(".SF") or item.filename.endswith(".RSA") or item.filename.endswith(".MF")):
                    continue
                buffer = zin.read(item.filename)
                zout.writestr(item, buffer)

            # Now add all files from frontend/dist (excluding any nested .apk files)
            for root, dirs, files in os.walk(DIST_DIR):
                for f in files:
                    if f.endswith(".apk") or f.endswith(".aab"):
                        continue
                    full_path = os.path.join(root, f)
                    rel_path = os.path.relpath(full_path, DIST_DIR).replace("\\", "/")
                    target_in_apk = f"assets/public/{rel_path}"
                    print(f"   + Adding {target_in_apk}")
                    zout.write(full_path, target_in_apk)

    print("2. Zipaligning APK...")
    align_cmd = [ZIPALIGN, "-p", "-f", "-v", "4", UNALIGNED_APK, ALIGNED_APK]
    res = subprocess.run(align_cmd, capture_output=True, text=True)
    if res.returncode != 0:
        print(f"Zipalign failed:\n{res.stderr}\n{res.stdout}")
        sys.exit(1)
    print("   Zipalign complete.")

    print("3. Generating or ensuring debug signing keystore...")
    ks_path = os.path.expanduser(r"~\.android\debug.keystore")
    if not os.path.exists(ks_path):
        ks_path = DEBUG_KEYSTORE
        gen_cmd = [
            KEYTOOL, "-genkey", "-v", "-keystore", ks_path,
            "-storepass", "android", "-alias", "androiddebugkey",
            "-keypass", "android", "-keyalg", "RSA", "-keysize", "2048",
            "-validity", "10000", "-dname", "CN=Android Debug,O=Android,C=US"
        ]
        res = subprocess.run(gen_cmd, capture_output=True, text=True)
        if res.returncode != 0:
            print(f"Keytool failed:\n{res.stderr}\n{res.stdout}")
            sys.exit(1)
    print(f"   Using keystore: {ks_path}")

    print("4. Signing APK with apksigner...")
    sign_cmd = [
        APKSIGNER, "sign",
        "--ks", ks_path,
        "--ks-pass", "pass:android",
        "--key-pass", "pass:android",
        "--ks-key-alias", "androiddebugkey",
        ALIGNED_APK
    ]
    res = subprocess.run(sign_cmd, capture_output=True, text=True, shell=True)
    if res.returncode != 0:
        print(f"Apksigner failed:\n{res.stderr}\n{res.stdout}")
        sys.exit(1)
    print("   Signing complete.")

    print("5. Verifying signed APK...")
    verify_cmd = [APKSIGNER, "verify", "-v", ALIGNED_APK]
    res = subprocess.run(verify_cmd, capture_output=True, text=True, shell=True)
    if res.returncode != 0:
        print(f"Verification failed:\n{res.stderr}\n{res.stdout}")
        sys.exit(1)
    print(res.stdout)

    print("6. Updating SusuRow.apk in root and in frontend/public/...")
    shutil.copy2(ALIGNED_APK, ORIG_APK)
    shutil.copy2(ALIGNED_APK, PUBLIC_APK)
    print(f"   Successfully updated {ORIG_APK} ({os.path.getsize(ORIG_APK)} bytes)")
    print(f"   Successfully updated {PUBLIC_APK} ({os.path.getsize(PUBLIC_APK)} bytes)")

    # Cleanup temp
    shutil.rmtree(TEMP_DIR)
    print("SUCCESS: APK successfully rebuilt with all latest production updates and signed!")

if __name__ == "__main__":
    main()
