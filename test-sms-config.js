"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
const axios_1 = __importDefault(require("axios"));
(0, dotenv_1.config)();
async function testSmsConfig() {
    console.log('=== Тестирование SMS конфигурации ===');
    const smsConfig = {
        login: process.env.SMS_LOGIN,
        password: process.env.SMS_PASSWORD,
        apiUrl: process.env.SMS_API_URL,
        sender: process.env.SMS_SENDER,
    };
    console.log('Переменные окружения:');
    console.log('SMS_LOGIN:', smsConfig.login ? 'задан' : 'НЕ ЗАДАН');
    console.log('SMS_PASSWORD:', smsConfig.password ? 'задан' : 'НЕ ЗАДАН');
    console.log('SMS_API_URL:', smsConfig.apiUrl || 'НЕ ЗАДАН');
    console.log('SMS_SENDER:', smsConfig.sender || 'НЕ ЗАДАН');
    if (!smsConfig.apiUrl) {
        console.error('❌ SMS_API_URL не задан');
        return;
    }
    try {
        const url = new URL(smsConfig.apiUrl);
        console.log('✅ SMS_API_URL валиден:', url.origin);
    }
    catch (error) {
        console.error('❌ SMS_API_URL невалиден:', error.message);
        return;
    }
    if (!smsConfig.login || !smsConfig.password || !smsConfig.sender) {
        console.error('❌ Не все обязательные параметры заданы');
        return;
    }
    console.log('\n=== Тестирование подключения к SMS API ===');
    try {
        const testParams = {
            login: smsConfig.login,
            password: smsConfig.password,
            phone: '79001234567', // тестовый номер
            text: 'Test message',
            sender: smsConfig.sender,
        };
        console.log('Отправка тестового запроса...');
        const response = await axios_1.default.get(smsConfig.apiUrl, {
            params: testParams,
            timeout: 10000,
        });
        console.log('✅ Ответ получен');
        console.log('Статус:', response.status);
        console.log('Данные:', response.data);
    }
    catch (error) {
        console.error('❌ Ошибка при тестировании:', error.message);
        if (error.code) {
            console.error('Код ошибки:', error.code);
        }
        if (error.response) {
            console.error('Статус ответа:', error.response.status);
            console.error('Данные ответа:', error.response.data);
        }
    }
}
testSmsConfig().catch(console.error);
