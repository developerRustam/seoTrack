export function formatDate(date:string) {
    if(!date) return "N/A";
    return (
        new Date(date).toLocaleString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    }))
}