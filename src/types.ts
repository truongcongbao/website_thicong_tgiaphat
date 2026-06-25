export interface Project {
  id: string;
  title: string;
  category: "tran-thach-cao" | "vach-nhua-composite" | "vach-pvc-vanda" | "tron-goi";
  image: string;
  area: number; // m2
  style: string;
  budget: string;
  location: string;
  description: string;
  videoUrl?: string; // YouTube or video walkthrough link
}

export interface StyleOption {
  id: string;
  name: string;
  description: string;
  traits: string[];
  colors: string[];
  image: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: {
    text: string;
    value: string; // style key like 'modern', 'japandi', 'neoclassic', 'indochine'
    image: string;
  }[];
}

export interface Message {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: Date;
}

export interface EstimateInput {
  area: number; // m2
  type: "chung-cu" | "nha-pho" | "biet-thu" | "van-phong";
  package: "tiet-kiem" | "cao-cap" | "thuong-gia";
  rooms: {
    livingRoom: boolean;
    bedroomCount: number;
    kitchen: boolean;
    bathroomCount: number;
  };
}

export interface EstimateResult {
  designCost: number;
  constructionCost: number;
  materialsCost: number;
  totalCost: number;
  breakdown: {
    name: string;
    cost: number;
    desc: string;
  }[];
}
