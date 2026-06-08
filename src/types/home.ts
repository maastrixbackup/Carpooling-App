export interface HomeStats {
  total_trips: number;
  total_spent: number;
  published_rides: number;
  co2_saved_kg: number;
}

export interface HomeRide {
  id: number;
  source_address: string;
  destination_address: string;
  ride_date: string;
  departure_time: string;
  available_seats: number;
  price_per_seat: number;
  driver_name: string;
  brand: string;
  model: string;
}

export interface HomeBootstrapResponse {
  user: any;
  stats: HomeStats;
  upcoming_booking: any;
  popular_routes: any[];
  available_rides: HomeRide[];
}
