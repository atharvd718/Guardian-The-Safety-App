export const chatWithARIA = async (
  message: string,
  history: { role: string; text: string }[] = []
) => {
  try {
    const response = await fetch('/api/aria/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history }),
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      return {
        success: false,
        text: data.text || 'Having trouble connecting. If emergency, call 112 immediately.',
      };
    }
    return { success: true, text: data.text };
  } catch (error) {
    return {
      success: false,
      text: 'Having trouble connecting. If emergency, call 112 immediately.',
    };
  }
};

export const detectDanger = async (message: string) => {
  try {
    const response = await fetch('/api/aria/danger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });
    if (!response.ok) {
      throw new Error('Danger detection request failed');
    }
    return await response.json();
  } catch {
    return {
      dangerLevel: 'low',
      suggestSOS: false,
      immediateAction: 'Stay aware of surroundings',
    };
  }
};
