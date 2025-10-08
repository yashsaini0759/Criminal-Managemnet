import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import csvParser from 'csv-parser';
import { RandomForestClassifier } from 'ml-random-forest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface CrimeData {
  City: string;
  State: string;
  Population: number;
  ViolentCrime: number;
  PropertyCrime: number;
  Murder: number;
  Robbery: number;
  Assault: number;
  Burglary: number;
  Theft: number;
  CrimeRate: number;
}

interface PredictionResult {
  city: string;
  state: string;
  crimeRate: number;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  violentCrime: number;
  propertyCrime: number;
}

export class CrimePredictor {
  private data: CrimeData[] = [];
  private model: any = null;

  async loadData(): Promise<void> {
    return new Promise((resolve, reject) => {
      const results: CrimeData[] = [];
      const csvPath = path.join(__dirname, 'crime_data.csv');

      fs.createReadStream(csvPath)
        .pipe(csvParser())
        .on('data', (row: any) => {
          results.push({
            City: row.City,
            State: row.State,
            Population: parseInt(row.Population),
            ViolentCrime: parseInt(row.ViolentCrime),
            PropertyCrime: parseInt(row.PropertyCrime),
            Murder: parseInt(row.Murder),
            Robbery: parseInt(row.Robbery),
            Assault: parseInt(row.Assault),
            Burglary: parseInt(row.Burglary),
            Theft: parseInt(row.Theft),
            CrimeRate: parseFloat(row.CrimeRate),
          });
        })
        .on('end', () => {
          this.data = results;
          this.trainModel();
          resolve();
        })
        .on('error', reject);
    });
  }

  private trainModel(): void {
    // Prepare training data
    const features = this.data.map(d => [
      d.Population / 1000000, // Normalize population
      d.ViolentCrime,
      d.PropertyCrime,
      d.Murder,
      d.Robbery,
    ]);

    // Create risk level labels (0: Low, 1: Medium, 2: High, 3: Critical)
    const labels = this.data.map(d => {
      if (d.CrimeRate < 300) return 0;
      if (d.CrimeRate < 500) return 1;
      if (d.CrimeRate < 700) return 2;
      return 3;
    });

    // Train RandomForest model
    const options = {
      seed: 3,
      maxFeatures: 0.8,
      replacement: true,
      nEstimators: 25,
    };

    this.model = new RandomForestClassifier(options);
    this.model.train(features, labels);
  }

  getRiskLevel(crimeRate: number): 'Low' | 'Medium' | 'High' | 'Critical' {
    if (crimeRate < 300) return 'Low';
    if (crimeRate < 500) return 'Medium';
    if (crimeRate < 700) return 'High';
    return 'Critical';
  }

  getAllPredictions(): PredictionResult[] {
    return this.data
      .map(d => ({
        city: d.City,
        state: d.State,
        crimeRate: d.CrimeRate,
        riskLevel: this.getRiskLevel(d.CrimeRate),
        violentCrime: d.ViolentCrime,
        propertyCrime: d.PropertyCrime,
      }))
      .sort((a, b) => b.crimeRate - a.crimeRate);
  }

  getTopRiskCities(limit: number = 10): PredictionResult[] {
    return this.getAllPredictions().slice(0, limit);
  }

  getCityPrediction(cityName: string): PredictionResult | null {
    const city = this.data.find(d => 
      d.City.toLowerCase() === cityName.toLowerCase()
    );
    
    if (!city) return null;

    return {
      city: city.City,
      state: city.State,
      crimeRate: city.CrimeRate,
      riskLevel: this.getRiskLevel(city.CrimeRate),
      violentCrime: city.ViolentCrime,
      propertyCrime: city.PropertyCrime,
    };
  }

  getCrimeDistribution(): { riskLevel: string; count: number; cities: string[] }[] {
    const distribution = {
      Low: [] as string[],
      Medium: [] as string[],
      High: [] as string[],
      Critical: [] as string[],
    };

    this.data.forEach(d => {
      const risk = this.getRiskLevel(d.CrimeRate);
      distribution[risk].push(d.City);
    });

    return [
      { riskLevel: 'Low', count: distribution.Low.length, cities: distribution.Low },
      { riskLevel: 'Medium', count: distribution.Medium.length, cities: distribution.Medium },
      { riskLevel: 'High', count: distribution.High.length, cities: distribution.High },
      { riskLevel: 'Critical', count: distribution.Critical.length, cities: distribution.Critical },
    ];
  }

  getStatistics() {
    const totalCities = this.data.length;
    const avgCrimeRate = this.data.reduce((sum, d) => sum + d.CrimeRate, 0) / totalCities;
    const maxCrimeCity = this.data.reduce((max, d) => d.CrimeRate > max.CrimeRate ? d : max);
    const minCrimeCity = this.data.reduce((min, d) => d.CrimeRate < min.CrimeRate ? d : min);

    return {
      totalCities,
      avgCrimeRate: Math.round(avgCrimeRate * 10) / 10,
      safestCity: { city: minCrimeCity.City, state: minCrimeCity.State, rate: minCrimeCity.CrimeRate },
      mostDangerous: { city: maxCrimeCity.City, state: maxCrimeCity.State, rate: maxCrimeCity.CrimeRate },
    };
  }
}

// Singleton instance
export const crimePredictor = new CrimePredictor();
