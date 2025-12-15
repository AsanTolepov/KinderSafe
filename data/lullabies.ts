// src/data/lullabies.ts

export interface LullabyTrack {
    id: number;
    title: string;
    url: string; // public papkaga nisbatan yo'l
  }
  
  /**
   * MP3 fayllarni public/lullabies ichiga tashlaysiz.
   * Masalan:
   *  public/lullabies/song1.mp3  => url: "/lullabies/song1.mp3"
   *
   * Faqat shu MASSIVNI o'zgartirib, qo'shiq nomi va fayl yo'lini yozasiz.
   */
  export const LULLABIES: LullabyTrack[] = [
    {
      id: 1,
      title: "Allayo alla",
      url: '/lullabies/Allayo alla.mp3',
    },
    {
      id: 2,
      title: "Alla Bolam Yulduz Usmonova",
      url: '/lullabies/Alla Bolam Yulduz Usmonova.mp3',
    },
    {
      id: 3,
      title: "Feruza Jumaniyozova - Alla (Official music)",
      url: '/lullabies/Feruza Jumaniyozova - Alla (Official music).mp3',
    },
    {
      id: 4,
      title: "Shahzoda- Alla",
      url: '/lullabies/Shahzoda- Alla.mp3',
    },
    {
      id: 5,
      title: "Gulsanam Mamazoitova Alla",
      url: '/lullabies/Gulsanam Mamazoitova Alla.mp3',
    },
  ];