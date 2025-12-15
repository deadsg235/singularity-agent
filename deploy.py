#!/usr/bin/env python3
"""
Deployment helper script for Singularity Agent
"""

import os
import subprocess
import sys

def check_requirements():
    """Check if all required files exist"""
    required_files = [
        'api/index.py',
        'requirements.txt',
        'vercel.json',
        'package.json',
        'public/index.html'
    ]
    
    missing_files = []
    for file in required_files:
        if not os.path.exists(file):
            missing_files.append(file)
    
    if missing_files:
        print("❌ Missing required files:")
        for file in missing_files:
            print(f"   - {file}")
        return False
    
    print("✅ All required files present")
    return True

def check_environment():
    """Check if environment variables are set"""
    env_file = '.env.local'
    if os.path.exists(env_file):
        print("✅ Found .env.local file")
        with open(env_file, 'r') as f:
            content = f.read()
            if 'GEMINI_API_KEY' in content:
                print("✅ GEMINI_API_KEY found in .env.local")
            else:
                print("⚠️  GEMINI_API_KEY not found in .env.local")
    else:
        print("⚠️  .env.local file not found")
        print("   Create it with: GEMINI_API_KEY=your_key_here")

def run_local_test():
    """Run a quick local test"""
    print("\n🧪 Running local test...")
    try:
        # Import the main app to check for import errors
        sys.path.append('api')
        from index import app
        print("✅ Flask app imports successfully")
        return True
    except Exception as e:
        print(f"❌ Import error: {e}")
        return False

def deploy_to_vercel():
    """Deploy to Vercel"""
    print("\n🚀 Deploying to Vercel...")
    try:
        # Check if vercel CLI is installed
        subprocess.run(['vercel', '--version'], check=True, capture_output=True)
        print("✅ Vercel CLI found")
        
        # Deploy
        result = subprocess.run(['vercel', '--prod'], capture_output=True, text=True)
        if result.returncode == 0:
            print("✅ Deployment successful!")
            print(result.stdout)
        else:
            print("❌ Deployment failed:")
            print(result.stderr)
            return False
            
    except subprocess.CalledProcessError:
        print("❌ Vercel CLI not found. Install with: npm i -g vercel")
        return False
    except Exception as e:
        print(f"❌ Deployment error: {e}")
        return False
    
    return True

def main():
    """Main deployment process"""
    print("🤖 Singularity Agent Deployment Helper\n")
    
    # Check requirements
    if not check_requirements():
        sys.exit(1)
    
    # Check environment
    check_environment()
    
    # Run local test
    if not run_local_test():
        print("\n❌ Local test failed. Fix errors before deploying.")
        sys.exit(1)
    
    # Ask user if they want to deploy
    deploy = input("\n🚀 Deploy to Vercel? (y/N): ").lower().strip()
    if deploy == 'y':
        if deploy_to_vercel():
            print("\n🎉 Deployment complete!")
            print("\n📝 Don't forget to:")
            print("   1. Set GEMINI_API_KEY in Vercel dashboard")
            print("   2. Optionally set ULTIMA_AGENT_SYSTEM_PROMPT")
            print("   3. Test your deployment URL")
        else:
            print("\n❌ Deployment failed. Check errors above.")
            sys.exit(1)
    else:
        print("\n✅ Pre-deployment checks complete. Ready to deploy when you are!")

if __name__ == "__main__":
    main()