const handleRemoveBackground = async () => {
  if (!selectedFile) return;

  try {
    setLoading(true);

    const blob = await removeBackground(selectedFile);

    const url = URL.createObjectURL(blob);

    setResultImage(url);
  } catch (err) {
    console.error(err);
    alert("Failed to remove background.");
  } finally {
    setLoading(false);
  }
};