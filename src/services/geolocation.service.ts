import { Injectable } from '@angular/core';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  address: string;
  withinAllowedRadius: boolean;
}

@Injectable({ providedIn: 'root' })
export class GeolocationService {
  private watchId: number | null = null;
  
  // Obtiene ubicación actual y resuelve dirección - SIEMPRE FRESCA, SIN CACHÉ
  async getCurrentLocation(allowedLat?: number, allowedLng?: number, radiusMeters: number = 200): Promise<LocationData> {
    console.log('🌍 Iniciando obtención de ubicación GPS (sin caché)...');
    
    // Limpiar cualquier watch anterior
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    
    let position: GeolocationPosition;
    
    try {
      // Usar watchPosition para obtener la ubicación más precisa disponible
      position = await this.getHighAccuracyPosition();
      console.log('✅ Ubicación GPS obtenida:', {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: new Date(position.timestamp).toLocaleString()
      });
    } catch (error: any) {
      console.error('❌ Error obteniendo ubicación GPS:', error);
      throw new Error(`No se pudo obtener la ubicación GPS: ${error.message}`);
    }
    
    const { latitude, longitude, accuracy } = position.coords;
    
    // Validar que no sea una ubicación muy imprecisa
    if (accuracy > 500) {
      console.warn('⚠️ Precisión GPS muy baja:', accuracy, 'm');
    }
    
    const address = await this.getAddressWithTimeout(latitude, longitude, 12000);
    
    const within = (allowedLat != null && allowedLng != null)
      ? this.validateRadius({ latitude: allowedLat, longitude: allowedLng }, { latitude, longitude }, radiusMeters)
      : true;
      
    return { latitude, longitude, accuracy, address, withinAllowedRadius: within };
  }

  // Obtener posición de alta precisión usando watchPosition para mejor accuracy
  private async getHighAccuracyPosition(): Promise<GeolocationPosition> {
    return new Promise<GeolocationPosition>((resolve, reject) => {
      let bestPosition: GeolocationPosition | null = null;
      let attempts = 0;
      const maxAttempts = 8; // Más intentos para mejor precisión
      let timeoutId: any;
      
      const options: PositionOptions = {
        enableHighAccuracy: true,
        maximumAge: 0, // NUNCA usar caché - siempre ubicación fresca
        timeout: 45000 // 45 segundos de timeout para dar más tiempo al GPS
      };
      
      // Timeout general de 20 segundos para dar tiempo a obtener señal precisa
      timeoutId = setTimeout(() => {
        if (this.watchId !== null) {
          navigator.geolocation.clearWatch(this.watchId);
          this.watchId = null;
        }
        
        if (bestPosition) {
          console.log('⏱️ Timeout alcanzado, usando mejor posición obtenida');
          resolve(bestPosition);
        } else {
          reject(new Error('Timeout: No se pudo obtener ubicación GPS en 20 segundos'));
        }
      }, 20000);
      
      // Usar watchPosition para obtener múltiples lecturas y quedarse con la mejor
      this.watchId = navigator.geolocation.watchPosition(
        (position) => {
          attempts++;
          console.log(`📍 Lectura GPS #${attempts}: ${position.coords.accuracy}m de precisión`);
          
          // Guardar si es la primera o si es más precisa que la anterior
          if (!bestPosition || position.coords.accuracy < bestPosition.coords.accuracy) {
            bestPosition = position;
            console.log(`📍 Nueva mejor precisión: ${position.coords.accuracy}m`);
          }
          
          // Si obtenemos precisión excelente (< 20m), resolver inmediatamente
          if (position.coords.accuracy <= 20) {
            clearTimeout(timeoutId);
            if (this.watchId !== null) {
              navigator.geolocation.clearWatch(this.watchId);
              this.watchId = null;
            }
            console.log('🎯 Precisión excelente obtenida (<20m)');
            resolve(position);
          }
          // Si obtenemos buena precisión (< 35m) después de 3 intentos, resolver
          else if (attempts >= 3 && position.coords.accuracy <= 35) {
            clearTimeout(timeoutId);
            if (this.watchId !== null) {
              navigator.geolocation.clearWatch(this.watchId);
              this.watchId = null;
            }
            console.log('✓ Buena precisión obtenida (<35m)');
            resolve(position);
          }
          // Si ya tenemos precisión aceptable (< 70m) después de 5 intentos, resolver
          else if (attempts >= 5 && position.coords.accuracy <= 70) {
            clearTimeout(timeoutId);
            if (this.watchId !== null) {
              navigator.geolocation.clearWatch(this.watchId);
              this.watchId = null;
            }
            console.log('✓ Precisión aceptable obtenida (<70m)');
            resolve(position);
          }
          // Después de máximo intentos, resolver con la mejor obtenida
          else if (attempts >= maxAttempts) {
            clearTimeout(timeoutId);
            if (this.watchId !== null) {
              navigator.geolocation.clearWatch(this.watchId);
              this.watchId = null;
            }
            console.log('📊 Máximo de intentos alcanzado, usando mejor resultado');
            resolve(bestPosition!);
          }
        },
        (error) => {
          clearTimeout(timeoutId);
          if (this.watchId !== null) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
          }
          
          let errorMsg = 'Error desconocido';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMsg = 'Permisos de GPS denegados. Permite el acceso a la ubicación.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMsg = 'Ubicación GPS no disponible. Verifica que el GPS esté activado.';
              break;
            case error.TIMEOUT:
              errorMsg = 'Timeout obteniendo ubicación GPS.';
              break;
          }
          
          reject(new Error(errorMsg));
        },
        options
      );
    });
  }

  // Reverse geocoding con mejor manejo de errores
  private async getAddressWithTimeout(lat: number, lng: number, timeoutMs: number): Promise<string> {
    try {
      // Ejecutar Nominatim y Photon en paralelo; quedarse con el primer resultado válido
      const providers = [
        this.fetchAddressFromNominatim(lat, lng, timeoutMs),
        this.fetchAddressFromPhoton(lat, lng, Math.max(7000, timeoutMs * 0.8))
      ];

      const address = await Promise.any(providers);
      if (address && address !== 'Dirección no disponible') {
        return address;
      }
    } catch (error: any) {
      if (error instanceof AggregateError) {
        console.warn('Ambos proveedores de geocodificación fallaron');
      } else {
        console.warn('Error obteniendo dirección:', error);
      }
    }

    // Fallback: mostrar coordenadas formateadas en vez de dejarlo vacío
    return `Lat ${lat.toFixed(5)}, Lng ${lng.toFixed(5)} (sin dirección)`;
  }

  private async fetchAddressFromNominatim(lat: number, lng: number, timeoutMs: number): Promise<string> {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
    
    try {
      const data = await this.fetchJsonWithTimeout(url, timeoutMs, {
        headers: {
          'Accept': 'application/json',
          'Accept-Language': 'es-ES',
          'User-Agent': 'SERGEVAApp/1.0 (sergeva-support@example.com)'
        }
      });

      if (!data) return 'Dirección no disponible';
      if (data.error) {
        console.warn('Error de Nominatim:', data.error);
        return 'Dirección no disponible';
      }

      return this.formatAddress(data.address, data.display_name, lat, lng);
    } catch (error: any) {
      // Normalizar aborts/timeout para no confundir con errores reales
      if (error?.name === 'AbortError') {
        console.warn('Consulta Nominatim abortada por timeout');
        return 'Dirección no disponible';
      }

      console.error('Error consultando Nominatim:', error?.message || error);
      return 'Dirección no disponible';
    }
  }

  // Fallback sin API key usando Photon (Komoot)
  private async fetchAddressFromPhoton(lat: number, lng: number, timeoutMs: number): Promise<string> {
    const url = `https://photon.komoot.io/reverse?lon=${lng}&lat=${lat}&limit=1`;

    try {
      const data = await this.fetchJsonWithTimeout(url, timeoutMs, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'SERGEVAApp/1.0 (sergeva-support@example.com)'
        }
      });

      if (!data || !data.features || data.features.length === 0) {
        return 'Dirección no disponible';
      }

      const props = data.features[0].properties || {};
      return this.formatPhotonAddress(props, lat, lng);
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        console.warn('Consulta Photon abortada por timeout');
        return 'Dirección no disponible';
      }
      console.error('Error consultando Photon:', error?.message || error);
      return 'Dirección no disponible';
    }
  }



  private async fetchJsonWithTimeout(url: string, timeoutMs: number, init?: RequestInit): Promise<any> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, { ...(init || {}), signal: controller.signal });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        // Propagar con información clara
        throw new DOMException('Timeout alcanzado en fetch', 'AbortError');
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  private formatAddress(address: any, fallback: string, lat: number, lng: number): string {
    if (!address) {
      return fallback || 'Dirección no disponible';
    }

    const parts = [
      address.road || address.street || address.highway,
      address.suburb || address.neighbourhood || address.residential,
      address.city || address.town || address.village || address.county,
      address.state || address.province,
      address.country
    ].filter((value, index, self) => !!value && self.indexOf(value) === index);

    const formatted = parts.join(', ');
    if (formatted) {
      return formatted;
    }

    return fallback || 'Dirección no disponible';
  }

  private formatPhotonAddress(props: any, lat: number, lng: number): string {
    if (!props) {
      return 'Dirección no disponible';
    }

    const parts = [
      [props.housenumber, props.street || props.name].filter(Boolean).join(' ').trim(),
      props.suburb || props.district || props.neighbourhood,
      props.city || props.town || props.village || props.county,
      props.state || props.state_district,
      props.country
    ].filter((value, index, self) => !!value && self.indexOf(value) === index);

    const formatted = parts.join(', ');
    return formatted || `Lat ${lat.toFixed(5)}, Lng ${lng.toFixed(5)} (sin dirección)`;
  }

  validateRadius(empLocation: { latitude: number; longitude: number; }, currentLocation: { latitude: number; longitude: number; }, radiusMeters: number): boolean {
    const dist = this.calculateDistance(empLocation.latitude, empLocation.longitude, currentLocation.latitude, currentLocation.longitude);
    return dist <= radiusMeters;
  }

  // Distancia Haversine en metros
  calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const toRad = (v: number) => (v * Math.PI) / 180;
    const R = 6371000; // m
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}
