from htc_model import compute_htc
from data import feedstocks

# Example input
m_total = 1000  # kg
moisture = 0.7  # 70%
feedstock = feedstocks["wood"]

results = compute_htc(m_total, moisture, feedstock)

print("\n--- HTC RESULTS ---")
for key, value in results.items():
    print(f"{key}: {value:.2f}")
