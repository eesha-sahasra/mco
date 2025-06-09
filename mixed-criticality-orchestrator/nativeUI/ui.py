from PyQt5.QtWidgets import QApplication, QMainWindow, QWidget, QVBoxLayout, QPushButton, QSizePolicy, QHBoxLayout
from PyQt5.QtMultimedia import QMediaPlayer, QMediaContent
from PyQt5.QtMultimediaWidgets import QVideoWidget
from PyQt5.QtCore import QUrl, Qt
import sys
vs_app_ip = "0.0.0.0"
vs_app_port = 5010

class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()

        # Set window properties
        self.setWindowTitle('Video Streaming')
        self.setGeometry(100, 100, 800, 600)

        # Central widget
        central_widget = QWidget(self)
        self.setCentralWidget(central_widget)

        # Main layout
        main_layout = QVBoxLayout(central_widget)
        main_layout.setAlignment(Qt.AlignCenter)  # Center all widgets in the main layout

        # Video widget
        self.video_widget = QVideoWidget(self)
        self.video_widget.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Expanding)
        main_layout.addWidget(self.video_widget)

        # Button layout
        button_layout = QHBoxLayout()
        button_layout.setAlignment(Qt.AlignCenter)  # Center the buttons horizontally
        button_layout.setSpacing(100)  # Set spacing between buttons

        # Start button with Play symbol
        self.play_button = QPushButton('\u25B6 START', self)
        self.play_button.setStyleSheet("""
            QPushButton {
                background-color: #185519;
                color: white;
                font-size: 18px;
                padding: 10px 30px;
                border-radius: 10px;
            }
            QPushButton:hover {
                background-color: #45a049;
            }
        """)
        self.play_button.clicked.connect(self.play_video)
        button_layout.addWidget(self.play_button)
        
        # Stop button with Stop symbol
        self.stop_button = QPushButton('⏹ STOP', self)
        self.stop_button.setStyleSheet("""
            QPushButton {
                background-color: #B80000;
                color: white;
                font-size: 18px;
                padding: 10px 30px;
                border-radius: 10px;                          
            }
            QPushButton:hover {
                background-color: #d32f2f;
            }
        """)
        self.stop_button.clicked.connect(self.stop_video)
        button_layout.addWidget(self.stop_button)

        # Add the button layout to the main layout
        main_layout.addLayout(button_layout)

        # Media player setup
        self.media_player = QMediaPlayer(self)
        self.media_player.setVideoOutput(self.video_widget)

        # Backend URL to play frames
        self.video_url = 'http://' + str(vs_app_ip) + ':' + str(vs_app_port) + '/video'
        self.media_player.setMedia(QMediaContent(QUrl(self.video_url)))

    def play_video(self):
        self.media_player.play()

    def stop_video(self):
        self.media_player.stop()

if __name__ == '__main__':
    app = QApplication(sys.argv)
    window = MainWindow()
    window.show()
    sys.exit(app.exec_())
