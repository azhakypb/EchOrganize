package com.main;
import com.amazon.ask.Skill;
import com.amazon.ask.SkillStreamHandler;
import com.amazon.ask.Skills;
import com.example.handlers.CancelAndStopIntentHandler;
import com.example.handlers.HelloWorldIntentHandler;
import com.example.handlers.HelpIntentHandler;
import com.example.handlers.LaunchRequestHandler;
import com.example.handlers.SessionEndedRequestHandler;
public class HelloWorldStreamHandler extends SkillStreamHandler {

    private static Skill getSkill() {
        return Skills.standard()
                .addRequestHandlers(
                        new CancelAndStopIntentHandler(),
                        new HelloWorldIntentHandler(),
                        new HelpIntentHandler(),
                        new LaunchRequestHandler(),
                        new SessionEndedRequestHandler())
                .withSkillId("amzn1.ask.skill.57f21a59-7bb0-494e-966a-3a10af99f6fa")
                .build();
    }
    public HelloWorldStreamHandler() {
        super(getSkill());
    }
}