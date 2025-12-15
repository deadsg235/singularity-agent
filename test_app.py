import sys
print("Python path:", sys.path)
print("Current working directory:", __file__)

try:
    from api.index import app
    print("App imported successfully")
    app.run(debug=True, port=5000)
except Exception as e:
    print(f"Error importing/running app: {e}")
    import traceback
    traceback.print_exc()