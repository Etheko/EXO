package com.exo.config;

import com.exo.model.Technology;
import com.exo.repository.TechnologyRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Component
public class TechnologyInitializer {

    @Autowired
    private TechnologyRepository technologyRepository;

    @Value("${exo.force.technology.init:false}")
    private boolean forceInit;

    @PostConstruct
    public void init() {
        if (forceInit) {
            System.out.println("Forcing technology initialization. Deleting all technologies...");
            technologyRepository.deleteAll();
        }

        List<Technology> expectedTechnologies = Arrays.asList(
                createTechnology("Java", "The powerhouse of enterprise software, used for building robust, large-scale applications.\nIt's the language I'm most familiar with and the one I've used the most.\nHowever, as you will be able to guess by the wide range of other tools I use, it's not the only one I use.", "https://www.java.com", "/assets/technologies/java.png"),
                createTechnology("Spring Boot", "My go-to framework for making web apps' backends.\nI've used this for making the backends of Bookmarks Forums, my final degree project, Bookmarks and this website.", "https://spring.io/projects/spring-boot", "/assets/technologies/spring-boot.png"),
                createTechnology("Angular", "Google's framework for building web apps.\nI've used this for making Bookmarks Forums, my final degree project, and Bookmarks!", "https://angular.io", "/assets/technologies/angular.png"),
                createTechnology("React", "The framework for those like me who like to build cool UIs for their projects.\nI've used this for making this website's frontend.", "https://reactjs.org", "/assets/technologies/react.png"),
                createTechnology("TypeScript", "JavaScript but with types, and also better, and also cooler.\nSince I mostly build frontends with Angular or React, I've had to use this quite a lot.", "https://www.typescriptlang.org", "/assets/technologies/typescript.png"),
                createTechnology("PostgreSQL", "Like MySQL but with steroids.\nThis is the DBMS used for this website's backend.\nIt's sadly not as widely supported as MySQL.", "https://www.postgresql.org", "/assets/technologies/postgresql.png"),
                createTechnology("MySQL", "What's a software engineer without knowing how to use MySQL?\nIt's my fav DBMS for making web apps' backends. It never fails me and it's available on most hosting services.", "https://www.mysql.com", "/assets/technologies/mysql.png"),
                createTechnology("Docker", "Cool logo!\nI've used this for making my own Docker images for my projects and to run my own containers.", "https://www.docker.com", "/assets/technologies/docker.png"),
                createTechnology("Tailwind CSS", "It would've been a pain in the ass to make this website without this.\nIt's like standard CSS but with a lot of pre-made classes to make your life easier.", "https://tailwindcss.com", "/assets/technologies/tailwind.png"),
                createTechnology("WebSockets", "I've created real-time chat apps with this, such as the chat in Bookmarks Forums, my final degree project.", "https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API", "/assets/technologies/websockets.png"),
                createTechnology("Azure", "Microsoft's cloud thingy that's worse than Google Cloud but better than using a rock to host stuff.\nI've used this for hosting Bookmarks Forums, my final degree project.", "https://azure.microsoft.com", "/assets/technologies/azure.png"),
                createTechnology("Figma", "As an UI nerd like me, I cannot live without this for making my mockups.\nI was the only one in my uni's HCI class who knew how to use this.", "https://www.figma.com", "/assets/technologies/figma.png"),
                createTechnology("FL Studio", "I like making music.\nI've tried Ableton Live, but I always come back to FL, my old friend.", "https://www.image-line.com/flstudio/", "/assets/technologies/fl-studio.png"),
                createTechnology("Vercel", "I frigging love Vercel.\nIt's so freaking easy to deploy frontend stuff and SPAs with it.\nGuess where this website's frontend is hosted?", "https://vercel.com", "/assets/technologies/vercel.png"),
                createTechnology("Render", "My choice for hosting web apps' backend stuff.\nThis website's backend is hosted on here!", "https://render.com", "/assets/technologies/render.png"),
                createTechnology("Adobe Photoshop", "I don't use it too much for photo editing per se, but I use it for making cool banners and pics for my projects.\nOh! I also draw with this!", "https://www.adobe.com/products/photoshop.html", "/assets/technologies/adobe-photoshop.png"),
                createTechnology("Adobe Illustrator", "All the icons of my projects have been made with this!", "https://www.adobe.com/products/illustrator.html", "/assets/technologies/adobe-illustrator.png"),
                createTechnology("Adobe After Effects", "oh boy cool intros, cool effects, cool animations, cool everything.\nCheck my YT channel: https://www.youtube.com/@Zhaxii", "https://www.adobe.com/products/aftereffects.html", "/assets/technologies/adobe-after-effects.png"),
                createTechnology("Adobe Premiere Pro", "idk how many vids i've edited with this.\nYou can just check my YT channel: https://www.youtube.com/@Zhaxii", "https://www.adobe.com/products/premiere.html", "/assets/technologies/adobe-premiere-pro.png"),
                createTechnology("Unity", "Yeah, I also make games.\nApparently...", "https://unity.com", "/assets/technologies/unity.png"),
                createTechnology("Cinema 4D", "I learnt how to use this at high school bc I wanted to create a 3D animation of the disassembly of a robot I made back then.\nAfter that, I've used this to create cool YT intros like everyone at my age was doing by then.", "https://www.maxon.net/en-us/products/cinema-4d", "/assets/technologies/cinema-4d.png"),
                createTechnology("IntelliJ IDEA", "For when I've had to deeply dive into Java stuff (specially web backends) since it's debugger is great and loads super fast.\nLovely UI, btw.", "https://www.jetbrains.com/idea/", "/assets/technologies/intellij-idea.png"),
                createTechnology("VS Code", "The good old reliable friend all full stack devs use bc it lets u code in literally any language u want. This website you're looking at rn was made with this.", "https://code.visualstudio.com/", "/assets/technologies/vscode.png"),
                createTechnology("PyCharm", "I made Spotytool with this!\nAlso, I have nightmares with this IDE since it's the one I used for coding algorithms and AI at university.", "https://www.jetbrains.com/pycharm/", "/assets/technologies/pycharm.png"),
                createTechnology("Visual Studio 2022", "The big old ass beast IDE Microsoft made once and almost never dared to update its old UI. If it works, it works. Right?\nI use this IDE for making games and coding GLSL shaders and other stuff.", "https://visualstudio.microsoft.com/downloads/", "/assets/technologies/visual-studio.png"),
                createTechnology("Rider", "The last resource in case Visual Studio 2022 ain't available for some reason. It integrates worse with Unity but it's UI is way better than VS :3.\nILY JetBrains!!", "https://www.jetbrains.com/rider/", "/assets/technologies/rider.png"),
                createTechnology("Android Studio", "I made a translator app with this thingy.", "https://developer.android.com/studio", "/assets/technologies/android-studio.png"),
                createTechnology("WebStorm", "Sometimes I hop to this IDE for debugging web related stuff since I like its debugger way more than VS Code's.\nAlso, it loads way faster than VS Code, but lacks tons of cool extensions VS Code has.", "https://www.jetbrains.com/webstorm/", "/assets/technologies/webstorm.png"),
                createTechnology("Microsoft 365", "who tf doesn't know how to use office?", "https://www.microsoft.com/en-us/microsoft-365", "/assets/technologies/microsoft-365.png")
        );

        Map<String, Technology> existingTechnologies = technologyRepository.findAll().stream()
                .collect(Collectors.toMap(Technology::getName, t -> t));

        for (Technology expected : expectedTechnologies) {
            Technology existing = existingTechnologies.get(expected.getName());
            if (existing != null) {
                boolean needsUpdate = !Objects.equals(existing.getDescription(), expected.getDescription()) ||
                        !Objects.equals(existing.getLink(), expected.getLink()) ||
                        !Objects.equals(existing.getIconString(), expected.getIconString());

                if (needsUpdate) {
                    existing.setDescription(expected.getDescription());
                    existing.setLink(expected.getLink());
                    existing.setIconString(expected.getIconString());
                    try {
                        existing.setIcon(existing.localImageToBlob(expected.getIconString()));
                    } catch (Exception e) {
                        System.err.println("Warning: Could not update icon for technology: " + existing.getName() + " - " + e.getMessage());
                    }
                    technologyRepository.save(existing);
                    System.out.println("Updated technology: " + existing.getName());
                }
            } else {
                try {
                    technologyRepository.save(expected);
                    System.out.println("Created new technology: " + expected.getName());
                } catch (Exception e) {
                    System.err.println("Error creating technology: " + expected.getName() + " - " + e.getMessage());
                }
            }
        }

        List<String> expectedNames = expectedTechnologies.stream()
                .map(Technology::getName)
                .collect(Collectors.toList());
        
        List<Technology> toDelete = existingTechnologies.values().stream()
                .filter(t -> !expectedNames.contains(t.getName()))
                .collect(Collectors.toList());

        if (!toDelete.isEmpty()) {
            technologyRepository.deleteAll(toDelete);
            System.out.println("Deleted " + toDelete.size() + " obsolete technologies.");
        }

        System.out.println("Technology initialization completed. Total technologies: " + technologyRepository.count());
    }

    private Technology createTechnology(String name, String description, String link, String iconPath) {
        try {
            return new Technology(name, description, link, iconPath);
        } catch (Exception e) {
            System.err.println("Error creating technology object for: " + name + " - " + e.getMessage());
            Technology tech = new Technology();
            tech.setName(name);
            tech.setDescription(description);
            tech.setLink(link);
            tech.setIconString(iconPath);
            return tech;
        }
    }
}
