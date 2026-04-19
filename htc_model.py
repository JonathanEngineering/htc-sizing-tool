def compute_htc(m_total, moisture, feedstock):
    """
    m_total: total biomass (kg)
    moisture: fraction (0–1)
    feedstock: dict from data.py
    """

    # --- Step 1: Mass breakdown ---
    m_dry = m_total * (1 - moisture)
    m_water = m_total * moisture

    # --- Step 2: Hydrochar production ---
    m_char = feedstock["yield"] * m_dry

    # --- Step 3: HHV ---
    hhv_char = feedstock["hhv_raw"] * feedstock["upgrade"]

    # --- Step 4: Energy output ---
    E_out = m_char * hhv_char  # MJ

    # --- Step 5: Energy input ---
    cp = 4.18  # kJ/kg·K
    delta_T = 175  # K

    E_in = (m_water * cp * delta_T) / 1000  # MJ

    # --- Step 6: Efficiency ---
    efficiency = E_out / E_in if E_in != 0 else 0

    return {
        "m_dry": m_dry,
        "m_water": m_water,
        "m_char": m_char,
        "hhv_char": hhv_char,
        "E_out": E_out,
        "E_in": E_in,
        "efficiency": efficiency
    }
