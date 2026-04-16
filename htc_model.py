from htc_model import calculate_htc, feedstocks

def print_header():
    print("=" * 50)
    print("        HYDROTHERMAL CARBONIZATION MODEL")
    print("=" * 50)


def print_inputs(moisture, temperature, time):
    print("\nINPUT PARAMETERS")
    print("-" * 50)
    print(f"Moisture Content : {moisture:.1f} %")
    print(f"Temperature      : {temperature:.1f} °C")
    print(f"Residence Time   : {time:.1f} min")


def print_results(results):
    print("\nRESULTS")
    print("-" * 50)
    print(f"{'Feedstock':<15}{'Yield':<10}{'Energy (MJ/kg)':<20}{'Score':<10}")
    print("-" * 50)

    for name, (y, e, s) in results.items():
        print(f"{name:<15}{y:<10.3f}{e:<20.2f}{s:<10.2f}")

    print("-" * 50)


def print_best(results):
    best = max(results, key=lambda x: results[x][2])
    print(f"\n🏆 Best Performance: {best} (Score = {results[best][2]:.2f})\n")


def main():
    print_header()

    # --- Inputs ---
    moisture = float(input("\nEnter Moisture Content (%): "))
    temperature = float(input("Enter Temperature (°C): "))
    time = float(input("Enter Residence Time (min): "))

    print_inputs(moisture, temperature, time)

    # --- Calculations ---
    results = {}
    for feedstock in feedstocks:
        results[feedstock] = calculate_htc(feedstock, moisture, temperature, time)

    # --- Output ---
    print_results(results)
    print_best(results)


if __name__ == "__main__":
    main()
