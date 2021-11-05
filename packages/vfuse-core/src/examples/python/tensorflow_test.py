import micropip
await micropip.install('https://storage.googleapis.com/tensorflow/mac/cpu/tensorflow-1.2.0-py2-none-any.whl')
import tensorflow as tf

(x_train, y_train),(x_test, y_test) = mnist.load_data()
x_train, x_test = x_train / 255.0, x_test / 255.0

model = tf.keras.models.Sequential([
tf.keras.layers.Flatten(input_shape=(28, 28)),
  tf.keras.layers.Dense(128, activation='relu'),
  tf.keras.layers.Dropout(0.2),
  tf.keras.layers.Dense(10, activation='softmax')
])

async def evaluate(data):
    import micropip
    await micropip.install('tensorflow')
    import tensorflow as tf

    model = data[0]
    x_train = data[1]
    y_train = data[2]
    x_test = data[3]
    y_test = data[4]

    mnist = tf.keras.datasets.mnist
    model.compile(optimizer='adam',
                  loss='sparse_categorical_crossentropy',
                  metrics=['accuracy'])

    model.fit(x_train, y_train, epochs=5)
    result =model.evaluate(x_test, y_test)
    return result

input = [model, x_train, y_train, x_test, y_test]

await VFuse.addJob(evaluate, [], input)
