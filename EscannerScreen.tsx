import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, ImageBackground, Alert } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import * as Location from 'expo-location';
import axios from 'axios';
import moment from 'moment-timezone';

const App: React.FC = () => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [text, setText] = useState('Aún no escaneado');
  const [action, setAction] = useState<'entrada' | 'salida' | null>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);

  const askForCameraPermission = () => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  };

  const askForLocationPermission = () => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso de ubicación denegado');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
    })();
  };

  // Solicitar permisos de cámara y ubicación
  useEffect(() => {
    askForCameraPermission();
    askForLocationPermission();
  }, []);

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    setText(data);
    console.log('Tipo: ' + type + '\nDatos: ' + data);

    const qrData = JSON.parse(data);

    const scanData = {
      name: qrData.name,
      puesto: qrData.puesto,
      timestamp: moment().tz('America/Mexico_City').format(),
      action: action,
      location: location ? {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      } : null,
    };

    try {
      await axios.post('http://192.168.1.4:5000/api/save-scan', scanData);
      alert('Datos guardados correctamente');
    } catch (error) {
      console.error('Error al guardar datos', error);
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text>Solicitando permiso para la cámara</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={{ margin: 10 }}>No hay acceso a la cámara</Text>
        <TouchableOpacity style={styles.button} onPress={askForCameraPermission}>
          <Text style={styles.buttonText}>Permitir Cámara</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ImageBackground source={require('./assets/img/2.jpg')} style={styles.background}>
      <View style={styles.container}>
        {!action ? (
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: 'green' }]}
              onPress={() => setAction('entrada')}
            >
              <Text style={styles.buttonText}>Entrada</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: 'red' }]}
              onPress={() => setAction('salida')}
            >
              <Text style={styles.buttonText}>Salida</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.scannerContainer}>
            <View style={styles.barcodebox}>
              <BarCodeScanner
                onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
                style={{ height: 400, width: 400 }}
              />
            </View>
            <Text style={styles.maintext}>{text}</Text>
            {scanned && (
              <TouchableOpacity style={styles.button} onPress={() => setScanned(false)}>
                <Text style={styles.buttonText}>¿Escanear de nuevo?</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.button} onPress={() => setAction(null)}>
              <Text style={styles.buttonText}>Cambiar acción</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  background: {
    flex: 1,
    resizeMode: 'cover',
    justifyContent: 'center',
  },
  maintext: {
    fontSize: 16,
    margin: 20,
  },
  barcodebox: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 300,
    width: 300,
    overflow: 'hidden',
    borderRadius: 30,
    backgroundColor: 'tomato',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  scannerContainer: {
    alignItems: 'center',
  },
  button: {
    backgroundColor: 'blue',
    padding: 15,
    borderRadius: 30,
    marginBottom: 10,
    marginHorizontal: 50,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
});

export default App;
