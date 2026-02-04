import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated } from 'react-native';
import LottieView from 'lottie-react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface ValueFruit {
  id: string;
  name: string;
  level: number;
  lastFed: string;
}

interface VisualTreeProps {
  values: ValueFruit[];
  onFruitPress: (fruit: ValueFruit) => void | Promise<void>;
}

// Coördinaten voor de vruchten (pas deze aan op basis van jouw Lottie-boom)
const fruitPositions = [
  { x: width / 2, y: 100 },
  { x: width / 2 - 85, y: 155 },
  { x: width / 2 + 85, y: 165 },
  { x: width / 2 - 110, y: 225 },
  { x: width / 2 + 110, y: 235 },
  { x: width / 2 - 45, y: 270 },
  { x: width / 2 + 55, y: 280 },
];

export const VisualTree: React.FC<VisualTreeProps> = ({ values, onFruitPress }) => {
  const lottieRef = useRef<LottieView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Controleer animatie-start
    const timer = setTimeout(() => {
      // Speelt af van frame 0 tot het einde (verhoog 150 als je boom niet vol is)
      lottieRef.current?.play(0, 150); 
    }, 200);

    // 2. Vruchten infaden nadat de boom grotendeels gegroeid is
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1200,
      delay: 2800, // Wacht 2.8 sec tot de bladeren er zijn
      useNativeDriver: true,
    }).start();

    // 3. Oneindige zweef-animatie voor een levendig effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: 1, duration: 2500, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 2500, useNativeDriver: true }),
      ])
    ).start();

    return () => clearTimeout(timer);
  }, []);

  const translateY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8], // Beweegt 8 pixels zachtjes op en neer
  });

  return (
    <View style={styles.container}>
      {/* De Lottie Boom */}
      <LottieView
        ref={lottieRef}
        source={require('../../assets/tree-growth.json')}
        style={styles.lottieTree}
        loop={false} // Geen herhaling
        autoPlay={true} // Handmatige controle via useEffect
        onAnimationFinish={() => {
          // Extra beveiliging: pauzeer op het laatste frame
          lottieRef.current?.pause();
        }}
      />

      {/* Interactieve Laag */}
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        {values.map((fruit, index) => {
          const pos = fruitPositions[index];
          if (!pos) return null;
          
          const size = 54 + (fruit.level * 6);

          return (
            <Animated.View
              key={fruit.id}
              style={[
                styles.fruitWrapper,
                { 
                  left: pos.x - size / 2, 
                  top: pos.y - size / 2,
                  opacity: fadeAnim,
                  transform: [{ translateY }]
                }
              ]}
            >
              <TouchableOpacity
                onPress={() => onFruitPress(fruit)}
                style={[
                  styles.fruitCircle,
                  { 
                    width: size,
                    height: size,
                    backgroundColor: fruit.level > 2.5 ? '#2ECC71' : '#E67E22',
                  }
                ]}
              >
                <MaterialCommunityIcons 
                  name={fruit.level > 4 ? "star-face" : "apple"} 
                  size={size * 0.42} 
                  color="white" 
                />
                <Text style={styles.fruitLabel} numberOfLines={1}>
                  {fruit.name}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 480,
    width: width,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  lottieTree: {
    width: width * 1.4,
    height: 550,
    position: 'absolute',
    bottom: -60,
  },
  fruitWrapper: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fruitCircle: {
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.7)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 10,
  },
  fruitLabel: {
    color: 'white',
    fontSize: 9,
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    paddingHorizontal: 4,
  }
});