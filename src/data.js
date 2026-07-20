export const steps = [
  'Eligibility',
  'Room Preferences',
  'Lifestyle',
  'Review & Authorize',
  'Matching Pool',
]

export const demoApplicant = {
  name: 'Alex Chan',
  eid: 'achan***',
}

export const roomTypes = [
  {
    id: 'large-double-78',
    name: 'Bedroom 1',
    nameZh: '1号卧室',
    image: '/images/rooms/bedroom-1.jpg',
    imageAlt: 'Visualization of the large double Bedroom 1 based on the official floor plan and interior reference',
    imageAltZh: '根据官方户型图和室内参考图生成的宽敞型双人1号卧室示意图',
    area: 'Approx. 16.9 m²',
    areaZh: '约 16.9 平方米',
    bathroom: 'Private en-suite bathroom',
    bathroomZh: '独立卫浴',
    occupancy: 'Double room',
    occupancyZh: '双人房',
    bed: '1A or 1B',
    bedZh: '1A 或 1B',
    resultBed: '1B',
    price: 78000,
  },
  {
    id: 'standard-double-60',
    name: 'Bedroom 2',
    nameZh: '2号卧室',
    image: '/images/rooms/bedroom-2.jpg',
    imageAlt: 'Visualization of the standard double Bedroom 2 based on the official floor plan and interior reference',
    imageAltZh: '根据官方户型图和室内参考图生成的标准型双人2号卧室示意图',
    area: 'Approx. 10.2 m²',
    areaZh: '约 10.2 平方米',
    bathroom: 'Shared bathroom',
    bathroomZh: '公共卫浴',
    occupancy: 'Double room',
    occupancyZh: '双人房',
    bed: '2A or 2B',
    bedZh: '2A 或 2B',
    resultBed: '2B',
    price: 60000,
  },
  {
    id: 'compact-double-48',
    name: 'Bedroom 3',
    nameZh: '3号卧室',
    image: '/images/rooms/bedroom-2.jpg',
    imageAlt: 'Shared visualization for the double-bedroom layout used by Bedrooms 2 and 3',
    imageAltZh: '2号与3号双人卧室共用的房间示意图',
    area: 'Approx. 8.1 m²',
    areaZh: '约 8.1 平方米',
    bathroom: 'Shared bathroom',
    bathroomZh: '公共卫浴',
    occupancy: 'Double room',
    occupancyZh: '双人房',
    bed: '3A or 3B',
    bedZh: '3A 或 3B',
    resultBed: '3B',
    price: 48000,
  },
  {
    id: 'single-60',
    name: 'Bedroom 4',
    nameZh: '4号卧室',
    image: '/images/rooms/bedroom-4.jpg',
    imageAlt: 'Visualization of the compact single Bedroom 4 based on the official floor plan and interior reference',
    imageAltZh: '根据官方户型图和室内参考图生成的紧凑型单人4号卧室示意图',
    area: 'Approx. 5–6 m²',
    areaZh: '约 5–6 平方米',
    bathroom: 'Shared bathroom',
    bathroomZh: '公共卫浴',
    occupancy: 'Single room',
    occupancyZh: '单人房',
    bed: '4A',
    bedZh: '4A',
    resultBed: '4A',
    price: 60000,
  },
  {
    id: 'single-78',
    name: 'Bedroom 5',
    nameZh: '5号卧室',
    image: '/images/rooms/bedroom-5.jpg',
    imageAlt: 'Visualization of the single Bedroom 5 based on the official floor plan and interior reference',
    imageAltZh: '根据官方户型图和室内参考图生成的单人5号卧室示意图',
    area: 'Approx. 8–9 m²',
    areaZh: '约 8–9 平方米',
    bathroom: 'Shared bathroom',
    bathroomZh: '公共卫浴',
    occupancy: 'Single room',
    occupancyZh: '单人房',
    bed: '5A',
    bedZh: '5A',
    resultBed: '5A',
    price: 78000,
  },
]

export const lifestyleQuestions = [
  {
    id: 'sleep',
    question: 'When do you usually go to sleep?',
    questionZh: '你通常几点睡觉？',
    options: ['Before 23:00', '23:00-00:00', '00:00-01:00', 'After 01:00'],
    optionsZh: ['23:00 前', '23:00-00:00', '00:00-01:00', '01:00 后'],
  },
  {
    id: 'wake',
    question: 'When do you usually wake up?',
    questionZh: '你通常几点起床？',
    options: ['Before 07:00', '07:00-09:00', '09:00-10:00', '10:00-11:00'],
    optionsZh: ['07:00 前', '07:00-09:00', '09:00-10:00', '10:00-11:00'],
  },
  {
    id: 'cleanliness',
    question: 'How tidy should shared spaces be?',
    questionZh: '你希望公共空间保持怎样的整洁程度？',
    options: ['Tidy at all times', 'Regular cleaning is enough', 'Clean when needed'],
    optionsZh: ['随时保持整洁', '定期清洁即可', '需要时再清洁'],
  },
  {
    id: 'noise',
    question: 'What sound environment do you prefer?',
    questionZh: '你更喜欢怎样的声音环境？',
    options: ['As quiet as possible', 'Normal daily sounds are fine', 'A lively environment is fine'],
    optionsZh: ['尽量安静', '可以接受正常生活声音', '可以接受较热闹的环境'],
  },
  {
    id: 'guests',
    question: 'How do you feel about visitors and social activity?',
    questionZh: '你对访客和室内社交活动的接受程度如何？',
    options: ['Prefer very little', 'Occasionally is fine', 'Often is fine within residence rules'],
    optionsZh: ['希望尽量少一些', '偶尔可以接受', '遵守宿舍规定的情况下，经常有也可以'],
  },
  {
    id: 'temperature',
    question: 'What room temperature do you prefer?',
    questionZh: '你喜欢怎样的室内温度？',
    options: ['Cooler', 'Moderate', 'Warmer', 'No strong preference'],
    optionsZh: ['偏凉', '适中', '偏暖', '没有明显偏好'],
  },
]

export const formatCurrency = (value) => `HK$${value.toLocaleString('en-HK')}`

export function localizeRoom(room, language) {
  if (language !== 'zh') return room
  return {
    ...room,
    name: room.nameZh,
    imageAlt: room.imageAltZh,
    area: room.areaZh,
    bathroom: room.bathroomZh,
    occupancy: room.occupancyZh,
    bed: room.bedZh,
  }
}

export function localizeQuestion(question, language) {
  if (language !== 'zh') return question
  return {
    ...question,
    question: question.questionZh,
  }
}

export function localizeAnswer(question, answer, language) {
  if (language !== 'zh' || !answer) return answer
  const optionIndex = question.options.indexOf(answer)
  return optionIndex >= 0 ? question.optionsZh[optionIndex] : answer
}
