package com.parkex.ocr;
import nu.pattern.OpenCV;
import java.nio.file.Path;
public final class Main {
    public static void main(String[] args) throws Exception {
        if (args.length < 1 || !args[0].equals("service")) {
            System.out.println("Uso:\n  java -jar target/matricula-ocr-1.0.0.jar service config.json");
            System.exit(2);
        }
        OpenCV.loadLocally();
        new LectorService(ServiceConfig.load(Path.of(args.length > 1 ? args[1] : "config.json"))).run();
    }
}
