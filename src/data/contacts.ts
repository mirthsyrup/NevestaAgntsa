export const contacts = {
    city: "Чебоксары, Чувашская Республика",
    address: "ул. Социалистическая 2г",
    mapUrl: "https://yandex.ru/maps/?text=56.108023,47.177126",
    phone: "+79373864064",
    phoneFormatted: "+7 (937) 386-40-64",
    email: "nevestaagntsa@gmail.com",
    socials: [
        { name: "Rutube", url: "https://rutube.ru/channel/42730775/", ariaLabel: "Rutube" },
        { name: "Telegram", url: "https://t.me/nevestaagntsa", ariaLabel: "Telegram" },
        { name: "MAX", url: "https://max.ru/join/M3Dv6oeVwqV-IdYiKvuuUPg8D1X6905NkvuNQjQW4TE", ariaLabel: "MAX" }
    ],
    schedule: [
        { day: "Воскресенье", time: [5, 6, 7].includes(new Date().getMonth()) ? "17:00" : "10:00" },
        {
            day: "Понедельник",
            events: [
                { name: "(Домашние группы)", time: "18:00" },
                { name: "(Домашние группы)", time: "18:00", day: "Вторник" }
            ]
        },
        { day: "Четверг (Изучение книги Откровения)", time: "17:30" },
        { 
            day: "Пятница", 
            events: [
                { name: "(Молитва за личные нужды)", time: "18:00" },
                { name: "(Молитвенное собрание)", time: "19:00" }
            ] 
        }
    ],
    copyright: "МРОХВЕП",
    churchName: 'Церковь "Невеста Агнца"'
};
