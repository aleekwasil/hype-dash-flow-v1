/** VTpass serviceID mapping for Nigerian networks. */
export type Network = "mtn" | "glo" | "airtel" | "9mobile";

export const NETWORKS: { id: Network; name: string; airtimeServiceID: string; dataServiceID: string; color: string }[] = [
  { id: "mtn",     name: "MTN",     airtimeServiceID: "mtn",     dataServiceID: "mtn-data",     color: "#FFCC00" },
  { id: "glo",     name: "Glo",     airtimeServiceID: "glo",     dataServiceID: "glo-data",     color: "#00B140" },
  { id: "airtel",  name: "Airtel",  airtimeServiceID: "airtel",  dataServiceID: "airtel-data",  color: "#E40000" },
  { id: "9mobile", name: "9mobile", airtimeServiceID: "etisalat",dataServiceID: "etisalat-data",color: "#00A859" },
];

export function getNetwork(id: string) {
  return NETWORKS.find((n) => n.id === id);
}
