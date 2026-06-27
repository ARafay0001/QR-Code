export default function QRForm({
  qrType,
  formData,
  handleChange,
}) {
  switch (qrType) {
    case "url":
      return (
        <input
          type="url"
          name="url"
          value={formData.url}
          onChange={handleChange}
          placeholder="https://example.com"
          className="w-full bg-slate-700 rounded-xl p-4 text-white border border-slate-600 outline-none focus:border-blue-500"
        />
      );

    case "text":
      return (
        <textarea
          name="text"
          value={formData.text}
          onChange={handleChange}
          rows={5}
          placeholder="Enter your text"
          className="w-full bg-slate-700 rounded-xl p-4 text-white border border-slate-600 outline-none focus:border-blue-500"
        />
      );

    case "email":
      return (
        <div className="space-y-4">
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="example@gmail.com"
            className="w-full bg-slate-700 rounded-xl p-4 text-white border border-slate-600 outline-none focus:border-blue-500"
          />

          <input
            type="text"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            placeholder="Subject"
            className="w-full bg-slate-700 rounded-xl p-4 text-white border border-slate-600 outline-none focus:border-blue-500"
          />

          <textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
            rows={4}
            placeholder="Message"
            className="w-full bg-slate-700 rounded-xl p-4 text-white border border-slate-600 outline-none focus:border-blue-500"
          />
        </div>
      );

    case "phone":
      return (
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          placeholder="+923001234567"
          className="w-full bg-slate-700 rounded-xl p-4 text-white border border-slate-600 outline-none focus:border-blue-500"
        />
      );

    case "sms":
      return (
        <div className="space-y-4">
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="+923001234567"
            className="w-full bg-slate-700 rounded-xl p-4 text-white border border-slate-600 outline-none focus:border-blue-500"
          />

          <textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
            rows={4}
            placeholder="SMS Message"
            className="w-full bg-slate-700 rounded-xl p-4 text-white border border-slate-600 outline-none focus:border-blue-500"
          />
        </div>
      );

    case "whatsapp":
      return (
        <div className="space-y-4">
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="+923001234567"
            className="w-full bg-slate-700 rounded-xl p-4 text-white border border-slate-600 outline-none focus:border-blue-500"
          />

          <textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
            rows={4}
            placeholder="WhatsApp Message"
            className="w-full bg-slate-700 rounded-xl p-4 text-white border border-slate-600 outline-none focus:border-blue-500"
          />
        </div>
      );

    case "wifi":
      return (
        <div className="space-y-4">
          <input
            type="text"
            name="wifiName"
            value={formData.wifiName}
            onChange={handleChange}
            placeholder="WiFi Name (SSID)"
            className="w-full bg-slate-700 rounded-xl p-4 text-white border border-slate-600 outline-none focus:border-blue-500"
          />

          <input
            type="password"
            name="wifiPassword"
            value={formData.wifiPassword}
            onChange={handleChange}
            placeholder="WiFi Password"
            className="w-full bg-slate-700 rounded-xl p-4 text-white border border-slate-600 outline-none focus:border-blue-500"
          />

          <select
            name="wifiSecurity"
            value={formData.wifiSecurity}
            onChange={handleChange}
            className="w-full bg-slate-700 rounded-xl p-4 text-white border border-slate-600 outline-none focus:border-blue-500"
          >
            <option value="WPA">WPA/WPA2</option>
            <option value="WEP">WEP</option>
            <option value="nopass">No Password</option>
          </select>
        </div>
      );

    case "location":
      return (
        <div className="grid md:grid-cols-2 gap-4">
          <input
            type="text"
            name="latitude"
            value={formData.latitude}
            onChange={handleChange}
            placeholder="Latitude"
            className="w-full bg-slate-700 rounded-xl p-4 text-white border border-slate-600 outline-none focus:border-blue-500"
          />

          <input
            type="text"
            name="longitude"
            value={formData.longitude}
            onChange={handleChange}
            placeholder="Longitude"
            className="w-full bg-slate-700 rounded-xl p-4 text-white border border-slate-600 outline-none focus:border-blue-500"
          />
        </div>
      );

    default:
      return null;
  }
}