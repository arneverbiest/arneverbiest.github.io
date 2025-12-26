// src/components/BreathingScreen.tsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';

const BREATHING_CYCLE = [
    { phase: 'Adem in', duration: 4, color: '#D4EFDF', textColor: '#1E8449', sub: 'Via je neus' }, // Groen
    { phase: 'Houd vast', duration: 7, color: '#FCF3CF', textColor: '#B7950B', sub: 'Focus op de rust' }, // Geel
    { phase: 'Adem uit', duration: 8, color: '#D6EAF8', textColor: '#2874A6', sub: 'Krachtig door je mond' }, // Blauw
];

const BreathingScreen: React.FC = () => {
    const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
    const [timer, setTimer] = useState(0);
    const [isActive, setIsActive] = useState(false);
    
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const colorAnim = useRef(new Animated.Value(0)).current;

    const currentPhase = BREATHING_CYCLE[currentPhaseIndex];

    const startAnimation = useCallback(() => {
        const duration = currentPhase.duration * 1000;

        // Cirkel animatie
        let toValue = 1;
        if (currentPhaseIndex === 0) toValue = 1.5; // Inademen = groter
        if (currentPhaseIndex === 1) toValue = 1.5; // Vasthouden = groot blijven
        if (currentPhaseIndex === 2) toValue = 1;   // Uitademen = kleiner

        Animated.timing(scaleAnim, {
            toValue: toValue,
            duration: duration,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
        }).start();

        // Kleur overgang animatie
        Animated.timing(colorAnim, {
            toValue: currentPhaseIndex,
            duration: 800,
            useNativeDriver: false,
        }).start();

    }, [currentPhaseIndex, scaleAnim, colorAnim]);

    useEffect(() => {
        if (!isActive) return;

        setTimer(currentPhase.duration);
        startAnimation();

        const interval = setInterval(() => {
            setTimer(prev => {
                if (prev > 1) return prev - 1;
                
                clearInterval(interval);
                setCurrentPhaseIndex(prevIndex => (prevIndex + 1) % BREATHING_CYCLE.length);
                return 0;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isActive, currentPhaseIndex, startAnimation]);

    const toggleBreathing = () => {
        if (isActive) {
            setIsActive(false);
            setCurrentPhaseIndex(0);
            scaleAnim.setValue(1);
            colorAnim.setValue(0);
        } else {
            setIsActive(true);
        }
    };

    // Interpolatie voor achtergrondkleur
    const backgroundColor = colorAnim.interpolate({
        inputRange: [0, 1, 2],
        outputRange: [BREATHING_CYCLE[0].color, BREATHING_CYCLE[1].color, BREATHING_CYCLE[2].color]
    });

    return (
        <Animated.View style={[styles.container, { backgroundColor }]}>
            <View style={styles.topSection}>
                <Text style={[styles.header, { color: currentPhase.textColor }]}>Ontspan je geest</Text>
                <Text style={styles.subHeader}>4-7-8 Methode</Text>
            </View>

            <View style={styles.centerSection}>
                <Animated.View style={[styles.circle, { transform: [{ scale: scaleAnim }], borderColor: currentPhase.textColor }]}>
                    <Text style={[styles.timerText, { color: currentPhase.textColor }]}>
                        {isActive ? timer : 'Ready?'}
                    </Text>
                </Animated.View>
                
                <Text style={[styles.phaseTitle, { color: currentPhase.textColor }]}>
                    {isActive ? currentPhase.phase : 'Tik op Start'}
                </Text>
                <Text style={styles.phaseSub}>
                    {isActive ? currentPhase.sub : 'Zoek een comfortabele houding'}
                </Text>
            </View>

            <TouchableOpacity
                style={[styles.mainButton, { backgroundColor: isActive ? '#E74C3C' : '#1A2E44' }]}
                onPress={toggleBreathing}
            >
                <Text style={styles.buttonText}>
                    {isActive ? 'Stop Oefening' : 'Start Ademhaling'}
                </Text>
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 60,
    },
    topSection: {
        alignItems: 'center',
    },
    header: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    subHeader: {
        fontSize: 16,
        color: '#566573',
        marginTop: 5,
    },
    centerSection: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    circle: {
        width: 160,
        height: 160,
        borderRadius: 80,
        borderWidth: 3,
        backgroundColor: 'rgba(255,255,255,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 40,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    timerText: {
        fontSize: 48,
        fontWeight: 'bold',
    },
    phaseTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    phaseSub: {
        fontSize: 18,
        color: '#566573',
        textAlign: 'center',
    },
    mainButton: {
        paddingVertical: 18,
        paddingHorizontal: 40,
        borderRadius: 30,
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
    },
    buttonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default BreathingScreen;