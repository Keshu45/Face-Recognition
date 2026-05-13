import csv
import os, cv2
import numpy as np
import pandas as pd
import datetime
import time

def TakeImage(l1, l2, haarcasecade_path, trainimage_path, message, err_screen, text_to_speech):
    
    if (l1 == "") and (l2 == ""):
        text_to_speech('Please Enter your Enrollment Number and Name.')

    elif l1 == '':
        text_to_speech('Please Enter your Enrollment Number.')

    elif l2 == "":
        text_to_speech('Please Enter your Name.')

    else:
        try:
            cam = cv2.VideoCapture(0, cv2.CAP_DSHOW)
            detector = cv2.CascadeClassifier(haarcasecade_path)

            Enrollment = l1
            Name = l2
            sampleNum = 0

            path = os.path.join(os.getcwd(), "TrainingImage")
            os.makedirs(path, exist_ok=True)

            last_capture_time = time.time()  # ⏳ timer

            while True:
                ret, img = cam.read()

                if not ret or img is None:
                    print("Camera issue, try again...")
                    continue

                gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
                faces = detector.detectMultiScale(gray, 1.3, 5)

                # 🔥 Instruction message
                cv2.putText(img, 
                            "Please move face: left, right, up, down", 
                            (20, 40),
                            cv2.FONT_HERSHEY_SIMPLEX, 
                            0.7, (0, 255, 0), 2)

                for (x, y, w, h) in faces:
                    cv2.rectangle(img, (x, y), (x+w, y+h), (255, 0, 0), 2)

                    # ⏳ Capture every 1 second
                    if time.time() - last_capture_time > 1:
                        sampleNum += 1

                        cv2.imwrite(
                            f"{path}/{Name}_{Enrollment}_{sampleNum}.jpg",
                            gray[y:y+h, x:x+w]
                        )

                        last_capture_time = time.time()

                cv2.imshow("Frame", img)

                if cv2.waitKey(1) & 0xFF == ord("q"):
                    break
                elif sampleNum > 50:
                    break

            cam.release()
            cv2.destroyAllWindows()

            # Save student details
            row = [Enrollment, Name]
            os.makedirs("StudentDetails", exist_ok=True)

            with open("StudentDetails/studentdetails.csv", "a+", newline="") as csvFile:
                writer = csv.writer(csvFile)
                writer.writerow(row)

            res = f"Images Saved for ER No: {Enrollment} Name: {Name}"
            message.configure(text=res)
            text_to_speech(res)

        except Exception as e:
            print(e)
            text_to_speech("Error occurred")