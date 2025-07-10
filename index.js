================================================================

// استيراد المكتبات المطلوبة
const express = require('express');
const RouterOSClient = require('node-routeros').RouterOSClient;
const cors = require('cors');
require('dotenv').config(); // لتحميل متغيرات البيئة من ملف .env

// إنشاء تطبيق Express
const app = express();

// استخدام CORS للسماح للطلبات من أي نطاق (مهم جداً لصفحة الويب الأمامية)
app.use(cors());

// تحديد البورت الذي سيعمل عليه الخادم
// Render ستقوم بتعيين هذا المتغير تلقائياً
const PORT = process.env.PORT || 3000;

// تعريف نقطة النهاية الرئيسية لجلب المستخدمين النشطين
app.get('/api/hotspot/active', async (req, res) => {
    console.log('تم استلام طلب جديد لجلب المستخدمين النشطين...');

    // تعريف متغيرات الاتصال بالمايكروتك من متغيرات البيئة
    // هذه هي نفس المتغيرات التي ستضيفها في إعدادات Render
    const host = process.env.MIKROTIK_HOST;
    const user = process.env.MIKROTIK_USER;
    const password = process.env.MIKROTIK_PASS;
    const apiPort = process.env.MIKROTIK_API_PORT || 8728; // المنفذ الافتراضي لـ API

    // التحقق من وجود جميع متغيرات البيئة المطلوبة
    if (!host || !user) {
        console.error('خطأ: متغيرات البيئة الخاصة بالمايكروتك غير مكتملة.');
        return res.status(500).json({
            error: true,
            message: 'إعدادات الخادم غير مكتملة. يرجى مراجعة متغيرات البيئة.'
        });
    }

    let client;
    try {
        // إنشاء اتصال جديد بالمايكروتك
        console.log(`محاولة الاتصال بـ ${host}:${apiPort}...`);
        client = new RouterOSClient({
            host: host,
            user: user,
            password: password,
            port: apiPort,
            secure: false, // اضبطها على true إذا كنت تستخدم API-SSL
            timeout: 5 // مهلة الاتصال بالثواني
        });

        // الاتصال الفعلي
        await client.connect();
        console.log('تم الاتصال بالمايكروتك بنجاح.');

        // تنفيذ الأمر لجلب المستخدمين النشطين
        console.log('تنفيذ الأمر: /ip/hotspot/active/print');
        const activeUsers = await client.write('/ip/hotspot/active/print');
        console.log(`تم العثور على ${activeUsers.length} مستخدم نشط.`);

        // إرسال البيانات كاستجابة JSON
        res.json({
            error: false,
            message: 'تم جلب البيانات بنجاح',
            data: activeUsers
        });

    } catch (err) {
        // التعامل مع الأخطاء (مثل فشل الاتصال، خطأ في اسم المستخدم/كلمة المرور)
        console.error('حدث خطأ أثناء الاتصال بالمايكروتك أو جلب البيانات:', err.message);
        res.status(500).json({
            error: true,
            message: 'فشل الاتصال بالمايكروتك. تأكد من صحة البيانات وتفعيل خدمة API.',
            details: err.message
        });
    } finally {
        // التأكد من إغلاق الاتصال دائماً بعد الانتهاء
        if (client && client.connected) {
            console.log('إغلاق الاتصال بالمايكروتك.');
            client.close();
        }
    }
});

// نقطة نهاية افتراضية للتحقق من أن الخادم يعمل
app.get('/', (req, res) => {
    res.send('خادم المايكروتك يعمل!');
});

// تشغيل الخادم للاستماع للطلبات
app.listen(PORT, () => {
    console.log(`الخادم يعمل الآن على البورت http://localhost:${PORT}`);
});
```
