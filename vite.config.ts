import { defineConfig } from "vite";

export default defineConfig({
  server: {
    host: "0.0.0.0", // เปิดให้เข้าถึงได้จากทุกอุปกรณ์ในเครือข่าย
    port: 5173, // ระบุพอร์ตที่ใช้ (หรือปล่อยเป็นค่าเริ่มต้น)
    proxy: {
      "/socket.io": {
        // target: 'http://localhost:4000', // สำหรับทดสอบในเครื่องตัวเอง
        target: "http://192.168.1.106:4000", // เปลี่ยน IP และ Port ให้ตรงกับ Back-end
        ws: true, // เปิด WebSocket สำหรับการเชื่อมต่อ
        changeOrigin: true, // เปลี่ยน origin ของ request
      },
    },
  },
});
