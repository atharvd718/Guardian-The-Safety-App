import { useState, useEffect } from 'react';

export interface BatteryState {
  level: number | null; // 0.0 to 1.0 (e.g. 0.15 for 15%)
  charging: boolean | null;
  isSupported: boolean;
  isLowBattery: boolean;
  batteryPercentage: number | null;
  simulatedLowBattery: boolean;
  toggleSimulatedLowBattery: () => void;
}

export function useBattery(): BatteryState {
  const [level, setLevel] = useState<number | null>(null);
  const [charging, setCharging] = useState<boolean | null>(null);
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [simulatedLowBattery, setSimulatedLowBattery] = useState<boolean>(false);

  useEffect(() => {
    let batteryObj: any = null;

    const handleBatteryChange = (b: any) => {
      setLevel(b.level);
      setCharging(b.charging);
    };

    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      (navigator as any)
        .getBattery()
        .then((b: any) => {
          batteryObj = b;
          setIsSupported(true);
          setLevel(b.level);
          setCharging(b.charging);

          b.addEventListener('levelchange', () => handleBatteryChange(b));
          b.addEventListener('chargingchange', () => handleBatteryChange(b));
        })
        .catch(() => {
          setIsSupported(false);
        });
    } else {
      setIsSupported(false);
    }

    return () => {
      if (batteryObj) {
        batteryObj.removeEventListener('levelchange', () => handleBatteryChange(batteryObj));
        batteryObj.removeEventListener('chargingchange', () => handleBatteryChange(batteryObj));
      }
    };
  }, []);

  const toggleSimulatedLowBattery = () => {
    setSimulatedLowBattery((prev) => !prev);
  };

  // Determine if battery is low (< 0.20 = below 20%) or if simulated
  const effectiveLevel = simulatedLowBattery ? 0.14 : level;
  const effectiveCharging = simulatedLowBattery ? false : charging;
  const batteryPercentage = effectiveLevel !== null ? Math.round(effectiveLevel * 100) : null;
  
  // Is low battery if battery level is below 20% (0.20) and not charging, OR simulated
  const isLowBattery =
    simulatedLowBattery ||
    (effectiveLevel !== null && effectiveLevel < 0.20 && effectiveCharging === false);

  return {
    level: effectiveLevel,
    charging: effectiveCharging,
    isSupported,
    isLowBattery,
    batteryPercentage,
    simulatedLowBattery,
    toggleSimulatedLowBattery,
  };
}
