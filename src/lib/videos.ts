import raw from "./videos-data.json";

export type VideoCat = "fellowship" | "technique" | "patients";
export type Video = { id: string; title: string; author: string; cat: VideoCat };

export const VIDEO_CATS: Record<VideoCat, string> = { fellowship: "Fellowship & training", technique: "Surgical techniques", patients: "Patient education" };

const cat = (t: string): VideoCat =>
  /fellowship|training|course|institute|hands[- ]on|program/i.test(t) ? "fellowship"
  : /implant|internal brace|surgery|arthroscopy|technique|ortho ?biologics|artemis|expertise/i.test(t) && !/exercise|recover|after|walking|fear|do's|क्या/i.test(t) ? "technique"
  : "patients";

// Imported from every page/post on arthroscopycollege.com (YouTube oEmbed titles).
export const VIDEOS: Video[] = (raw as { id: string; title: string; author: string }[])
  .filter((v) => !/do not delete/i.test(v.title))
  .map((v) => ({ ...v, title: v.title.replace(/\s*#\S+/g, "").replace(/\s{2,}/g, " ").trim(), cat: cat(v.title) }));

// Featured on the homepage, in this order (original homepage videos first).
const FEATURED = ["gJz1rAvU0n4", "rEuDGkkv99Q", "twcQl-uuEqI", "41ohFGiW_ak", "QILsw563Qss", "kAW51rVWYGA"];
export const FEATURED_VIDEOS = FEATURED.map((id) => VIDEOS.find((v) => v.id === id)).filter((v): v is Video => !!v);
