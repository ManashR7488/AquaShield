# water_quality_check.py7

# Predict water quality based on user input

def check_water_quality():
    print("Enter water parameters to check quality:\n")
    
    try:
        ph = float(input("pH: "))
        hardness = float(input("Hardness: "))
        solids = float(input("Solids: "))
        chloramines = float(input("Chloramines: "))
        sulfate = float(input("Sulfate: "))
        conductivity = float(input("Conductivity: "))
        organic_carbon = float(input("Organic Carbon: "))
        trihalomethanes = float(input("Trihalomethanes: "))
        turbidity = float(input("Turbidity: "))
    except:
        print("❌ Invalid input! Please enter numbers only.")
        return

    # Simple rule-based check (adjust thresholds as needed)
    safe = True
    if not (6.5 <= ph <= 8.5):
        safe = False
    if hardness > 200:
        safe = False
    if solids > 500:
        safe = False
    if chloramines > 4:
        safe = False
    if sulfate > 250:
        safe = False
    if conductivity > 500:
        safe = False
    if organic_carbon > 10:
        safe = False
    if trihalomethanes > 80:
        safe = False
    if turbidity > 5:
        safe = False

    if safe:
        print("\n✅ Water is POTABLE (safe to drink)")
    else:
        print("\n⚠️ Water is NOT POTABLE (unsafe to drink)")

# Run the function
check_water_quality()
